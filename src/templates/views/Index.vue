<template>
  <div class="md-layout">
    <div class="md-layout-item md-size-100">
      <md-card>
        <md-card-header class="md-card-header-icon md-card-header-green">
          <md-button type="button" >
            <router-link :to="{name:'{{pascalPlural}} New'}">Create</router-link>
          </md-button>
          <div class="card-icon">
            <md-icon>assignment</md-icon>
          </div>
          <h4 class="title">{{paginationData.total}} total {{pascalPlural}}</h4>
        </md-card-header>
        <md-card-content>
          <div class="md-content md-table md-theme-default">
          <vuetable
            ref="vuetable"
            :api-url="api"
            :first-page="0"
            :css="table_css.table"
            :show-sort-icons="true"
            :append-params="moreParams"
            :http-options="{ headers:{ 'Authorization' : 'Bearer ' + $auth.token() } }"
            @vuetable:loaded="loadTable"
            @vuetable:cell-clicked="showSingle"
            :fields="columns.filter(s => s.active === true)"
            data-path="data"
            pagination-path=""
            :no-data-template="rowCount === null ? 'Loading data' : 'No Data Available'"
            @vuetable:pagination-data="onPaginationData"
          >
            <template slot="sn" slot-scope="props">
              <router-link
                :to="{name: '{{pascalPlural}} Edit', params: {id: props.rowData.id}}"
              >{{props.rowIndex + 1}}</router-link>
            </template>

            <template slot="actions" slot-scope="props">
              <router-link :to="{name:'{{pascalPlural}} Edit', params: {id: props.rowData.id}}">
                <md-button type="button" :class="'md-button md-danger md-theme-default'" >
                  Edit
                </md-button>
              </router-link>
              <md-button :class="'md-button md-info md-theme-default'" type="button" @click="deleteItem(props.rowData.id)"  >
                Delete
              </md-button>
            </template>
          </vuetable>
          <vuetable-pagination
            v-show="paginationData.total"
            :css="table_css.pagination"
            ref="pagination"
            @vuetable-pagination:change-page="onChangePage"
          ></vuetable-pagination>
          <div class="text-center" v-if="rowCount <=0 || rowCount === null">
            <slot name="empty"></slot>
          </div>
          </div>
        </md-card-content>
      </md-card>
    </div>
  </div>
</template>
<script>
import VuetableCss from "@/helpers/vuetable_styling.js";
import VuetablePagination from "@/components/Pagination";
import getPaginationData from "@/helpers/pagination";
import {truncate} from "@/helpers/string";

export default {
  title:'{{pascalPlural}}',
  components: {
    VuetablePagination
  },
  data() {
    return {
      rowCount: null,
      visibleFilter: false,
      table_css: VuetableCss,
      api: this.$baseApi + `/{{snakeCase}}`,
      columns: [
        // Insert columns here
        {
          name: "__slot:actions",
          title: "Actions",
          active: true,
        }
      ],
      moreParams: {},
      paginationData: {},
      filterColumns: []
    };
  },
  methods: {
    getPaginationData,
    onPaginationData(paginationData) {
      delete paginationData.data;
      this.paginationData = getPaginationData(this.api,paginationData);
      this.$refs.pagination.setPaginationData(this.paginationData);
    },
    showSingle(e) {
      this.$router.push({
        name: "{{pascalPlural}} Edit",
        params: { id: e.id }
      });
    },
    loadTable() {
      let d = this.$refs.vuetable.tableData;
      this.rowCount = parseInt(d && d.length);
    },
    setFilters(d) {
      for (let [key, value] of Object.entries(this.moreParams)) {
        if (typeof value === "object") {
          //append id to params
          this.moreParams[key + "_id"] = value.id;
        }
        if (value === "") {
          delete this.moreParams[key];
        }
      }
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
      this.columns.find(s => s.name === data.name).active = data.val;
      let sm = this;
      this.$nextTick(() => {
        sm.$refs.vuetable.refresh();
        sm.$refs.vuetable.normalizeFields();
      });
    },
    deleteItem(id) {
      let r = confirm(`Are you sure you want to delete {{singular}} #${id}?`);
      if(!r) {
        return;
      }
      this.$store.dispatch('{{singular}}/delete', id).then((data) => {
        this.refreshTable();
      })
    }
  },
  computed: {

  },
  mounted() {

  }
};
</script>
<style scoped>
.table-transparent {
  background-color: transparent !important;
}

.mt-0 {
  margin-top: 0 !important;
}
</style>
