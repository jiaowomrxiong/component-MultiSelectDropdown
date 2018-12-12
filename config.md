# GraceMultiSelectCascader

参数名|类型|默认值|说明
:-: | :-: | :-: | :-:
`beforeSelect`|`function`|`(所有数据, 当前选中项, 当前层级) => true`|`点击项时触发，如果返回false表示不可选`
`channel`|`array<channelItem>`|`[]`|`-`
`className`|`string`|`''`|`-`
`disabled`|`bool`|`false`|`是否可用`
`isOpen`*|`bool`|`false`|`是否打开`
`noDataText`|`string`|`暂无数据`|`没有数据时候的提示信息`
`onChange`|`function`|`categorySelected => { }`|`选择回调`
`onSearchFilter`|`function`|`略`|`过滤匹配字符串时触发，可以自定义匹配算法和控制下拉框显示内容`
`searchText`*|`string`|`''`|`默认的要搜索的字符串`
`selectedArr`*|`array`|`[]`|`二维数组,用于设置默认选中的对象。数组中的每个元素代表一个选中项，只需要设置code字段即可,需要将所有code返回,如果其中某一级code找不到，则后面的选中状态都失效`

## channelItem &lt;object>

参数名|类型|默认值|说明
:-: | :-: | :-: | :-:
`name`|`string`|`-`| `每一项select的显示文案`
`code`|`string`|`-`| `每一项select的code，全局唯一`
`children`|`Array`|`-`| `子元素,可没有`
`className`|`string`|`-`| `每一项select的className`
