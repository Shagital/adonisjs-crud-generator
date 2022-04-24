<template>
  <div class="container-fluid">
    <div >
      <div >
        <div class="grid">
          <div>
            <small class="text-opacity"
              >{{ $t('index.total_summary', {number: paginationData.total, resource: '{{pascalPlural}}'}) }}</small
            >
          </div>
        </div>
        <br />
        <filter-dropdown
          @setFilters="setFilters"
          :params="moreParams"
        ></filter-dropdown>

        <button
          @click="clearFilters"
          :class="`px-2 py-3 mt-2 mb-2 bg-red-600 rounded-md text-white font-small tracking-wide hover:bg-red-400`"
        >
         {{$t('index.clear_filters')}}
        </button>
      </div>
      <div

      >
        <vuetable
          ref="vuetable"
          :css="table_css.table"
          style="width: 100%"
          :api-url="api"
          :append-params="moreParams"
          :http-options="{
            headers: { Authorization: 'Bearer ' + $auth.token() },
          }"
          @vuetable:loaded="loadTable"
          @vuetable:cell-clicked="goto"
          :fields="columns.filter((s) => s.active === true)"
          data-path="data"
          pagination-path
          :no-data-template="
            rowCount === null ? $t('index.loading_data') : $t('index.no_data')
          "
          @vuetable:pagination-data="onPaginationData"
        >
          <template slot="sn" slot-scope="props">
              <router-link
                :to="{name: '{{pascalPlural}}Edit', params: {id: props.rowData.id}}"
              >{{props.rowIndex + 1}}</router-link>
            </template>

             <template slot="actions" slot-scope="props">
               <div class="dropdown inline relative">
              <button
                class="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded inline-flex items-center"
              >
                  <i class="icon-caret-down"></i>
              </button>
              <ul class="dropdown-menu hidden text-gray-700 pt-1">

               <a v-if="$auth.user().id != props.rowData.id"
               href='#'
              @click="confirmDeletion(props.rowData)"
              :class="`text-xs rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 inline whitespace-no-wrap`"
            >
              {{$t('index.delete')}}
            </a>

                <li class="">
                  <router-link
                    :class="`text-xs rounded-t bg-gray-200 hover:bg-gray-400 py-2 px-4 inline whitespace-no-wrap`"
                    :to="{ name: '{{pascalPlural}}Edit', params: {id: props.rowData.id} }"
                    >{{$t('index.view')}}/{{$t('index.edit')}}</router-link
                  >
                </li>
              </ul>
            </div>
            </template>
        </vuetable>
        <vuetable-pagination
          v-show="paginationData.total"
          :css="table_css.pagination"
          ref="pagination"
          @vuetable-pagination:change-page="onChangePage"
        ></vuetable-pagination>
        <div class="text-center" v-if="rowCount <= 0 || rowCount === null">
          <slot name="empty"></slot>
        </div>
      </div>
    </div>
    <modal v-if="deleteAction"
      :open="deleteAction"
      @performAction="deleteItem"
      :model="model"
      :title="title"
      :description="description"
    ></modal>
  </div>
</template>


<script>
import VuetableCss from "@/helpers/vuetable_styling.js";
import getPaginationData from "@/helpers/pagination";
import {truncate} from "@/helpers/global";
import FilterDropdown from "./Filter";
import VuetablePagination from "@/components/VueTablePagination";
import Modal from "@/components/Modal";
import { toLocal } from "@/helpers/date";
import { handleError, handleSuccess } from "@/helpers/response";

export default {
  title: ['{{snakeCase}}.title'],
  components: {
    VuetablePagination, FilterDropdown, Modal
  },
  data() {
    return {
      title: null,
      description: null,
      model: null,
      deleteAction: false,
      rowCount: null,
      visibleFilter: false,
      table_css: VuetableCss,
      api: this.$baseApi + `/{{snakeCase}}`,
      columns: [
        // Insert columns here. Do not remove
        {
          name: "__slot:actions",
         title: () => { return this.$t('action')},
          active: true,
        }
      ],
       moreParams: {
        per_page: 25,
        page: 1,
      },
      paginationData: {},
      filterColumns: []
    };
  },
  methods: {
    toLocal,
    getPaginationData,
    onPaginationData(paginationData) {
      this.paginationData = getPaginationData(paginationData, this.moreParams);
      this.$refs.pagination.setPaginationData(this.paginationData);
    },
    goto(e) {
      this.$router.push({ name: '{{pascalPlural}}Edit', params: {id: e.id} });
    },
    loadTable() {
      let d = this.$refs.vuetable.tableData;
      this.rowCount = d && d.length;
    },
    setFilters(data) {
      for (let [key, value] of Object.entries(this.moreParams)) {
        if (typeof value === "undefined") {
          delete this.moreParams[key];
        }

        let data, newData;
        switch (key) {

          default:
            this.moreParams[key] = value;
            break;
        }
      }

      let sm = this;
      this.$nextTick(() => {
        sm.$refs.vuetable.refresh();
        sm.rowCount = sm.$refs.vuetable.tableData;
        sm.loadTable();
      });
    },
    clearFilters() {
      this.moreParams = {};
      let sm = this;
      this.$nextTick(() => {
        sm.$refs.vuetable.refresh();
        sm.rowCount = sm.$refs.vuetable.tableData;
        sm.loadTable();
      });
    },
    onChangePage(page) {
      this.moreParams.page = page;
      this.setFilters();
    },
    refreshTable() {
      this.$refs.vuetable.refresh();
    },
    showVisibleFilter(d) {
      this.visibleFilter = d;
    },
    removeColumnFromTable(data) {
      this.columns.find((s) => s.name === data.name).active = data.val;
      let sm = this;
      this.$nextTick(() => {
        sm.$refs.vuetable.refresh();
        sm.$refs.vuetable.normalizeFields();
      });
    },
    deleteItem({ id, status }) {
      this.$store
        .dispatch("{{singular}}/delete", id)
        .then((data) => {
          handleSuccess(this, data.message || this.$t(`success.delete`, {resource: `{{pascalName}} #${id}`}));
          this.refreshTable();
        })
        .catch((err) => {
          handleError(this, err, this.$t(`error.delete`, {resource: `{{pascalName}} #${id}`}));
        })
        .finally(() => {
          this.model = {};
          this.title = "";
          this.description = "";
          this.deleteAction = false;
        });
    },
    confirmDeletion(model) {
      this.title = this.$t('delete.title', {resource: `{{pascalName}} #${id}`});
      this.description = this.$t('delete.description', {resource: `{{pascalName}} #${id}`})
      this.model = model;
      this.deleteAction = true;
    },
  },
  computed: {

  },
  created() {
    let moreParams = this.moreParams;
    this.moreParams = { ...moreParams, ...this.$route.query };

    this.loaded = true;
  },
};
</script>
