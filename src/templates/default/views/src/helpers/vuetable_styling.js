// Bootstrap4 + FontAwesome Icon
export default {
    table: {
        tableWrapper: '',
        tableHeaderClass: '',
        tableBodyClass: 'bg-white',
        tableClass: '',
        loadingClass: 'loading',
        ascendingIcon: 'fa fa-chevron-up',
        descendingIcon: 'fa fa-chevron-down',
        ascendingClass: 'sorted-asc',
        descendingClass: 'sorted-desc',
        sortableIcon: 'fa fa-sort',
        detailRowClass: 'px-3 py-2 whitespace-no-wrap',
        handleIcon: 'fa fa-bars text-secondary',
        renderIcon(classes) {
            return `<i class="${classes.join(' ')}"></span>`
        }
    },
    pagination: {
        wrapperClass: 'pagination float-right',
        activeClass: 'active',
        disabledClass: 'disabled',
        pageClass: 'page-item',
        linkClass: 'page-link',
        paginationClass: 'pagination',
        paginationInfoClass: 'float-left',
        dropdownClass: 'form-control',
        icons: {
            first: 'fa fa-chevron-left',
            prev: 'fa fa-chevron-left',
            next: 'fa fa-chevron-right',
            last: 'fa fa-chevron-right',
        }
    }
}
