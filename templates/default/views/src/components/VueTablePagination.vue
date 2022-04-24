<template>
    <nav>
        <ul class="pagination">
            <li :class="['page-item', {'disabled': isOnFirstPage}]">
                <a class="page-link" @click.prevent="loadPage('prev')">
                    <span>&laquo;</span>
                </a>
            </li>

            <template v-if="notEnoughPages">
                <li v-for="n in totalPage" :key="n" :class="['page-item', {'active': isCurrentPage(n)}]">
                    <a class="page-link" @click.prevent="loadPage(n)" v-html="n"></a>
                </li>
            </template>
            <template v-else>
                <li v-for="n in windowSize" :key="n" :class="['page-item', {'active': isCurrentPage(windowStart+n-1)}]">
                    <a class="page-link" @click.prevent="loadPage(windowStart+n-1)" v-html="windowStart+n-1"></a>
                </li>
            </template>

            <li :class="['page-item', {'disabled': isOnLastPage}]">
                <a class="page-link" href="" @click.prevent="loadPage('next')">
                    <span>&raquo;</span>
                </a>
            </li>

        </ul>
        <p :class="['page-item']" v-if="this.tablePagination">{{$t('pagination_showing', {current_page: this.tablePagination.current_page, last_page: this.tablePagination.last_page})}}</p>
    </nav>

</template>

<script>
    import VuetablePaginationMixin from "vuetable-2/src/components/VuetablePaginationMixin";
    export default {
        mixins: [VuetablePaginationMixin]
    };
</script>
