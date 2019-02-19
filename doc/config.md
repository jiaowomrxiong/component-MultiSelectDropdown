# GraceMultiSelectCascader

参数名|类型|默认值|说明
:-: | :-: | :-: | :-:
`beforeSelect`|`function`|`(所有数据, 当前选中项, 当前层级) => true`|`点击项时触发，如果返回false表示不可选`
`channel`|`array<channelItem>`|`[]`|`-`
`className`|`string`|`''`|`-`
`disabled`|`bool`|`false`|`下拉框是否禁用`
`isOpen`*|`bool`|`false`|`是否默认打开`
`notCloseWhenClickOther`*|`bool`|`false`|`当openMethod为click时，点击其他地方是否关闭`
`noDataContent`|`string/node`|`暂无数据`|`没有数据时候的提示信息`
`onChange`|`function`|`categorySelected => { }`|`选择回调`
`onSearchFilter`|`function`|`略`|`过滤匹配字符串时触发，可以自定义匹配算法和控制下拉框显示内容`
`onSearchTextChange`|`function`|`text => text`|`过滤匹配字符串时触发，可以自定义函数以改变输入的搜索关键字`
`openMethod`|`string`|`click`|`自定义下拉框的打开方式,hover/click`
`searchPlaceholder`|`string`|`请输入`|`搜索框placeholder`
`searchText`*|`string`|`''`|`默认的要搜索的字符串`
`selectedArr`*|`array`|`[]`|`二维数组,用于设置默认选中的对象。数组中的每个元素代表一个选中项，只需要设置code字段即可,需要将所有code返回,如果其中某一级code找不到，则该默认选中项失效`
`selAllOption`*|`object`|`{code: 99999, name: '全部'}`|`表示'全部'选项的对象, code默认为99999`
`buttonContent`*|`node`|`[<span key='default-dom'></span>]`|`触发下拉框展示或收起的Dom`

## channelItem &lt;object>

参数名|类型|默认值|说明
:-: | :-: | :-: | :-:
`name`|`string`|`-`| `每一项select的显示文案`
`code`|`string`|`-`| `每一项select的code，全局唯一`
`children`|`Array`|`-`| `子元素,可没有`
`className`|`string`|`-`| `每一项select的className`

## categorySelected &lt;object> 输出对象

参数名|类型|默认值|说明
:-: | :-: | :-: | :-:
`channel`|`array<channelItem>`|`-`| `所有选中项`
`currentItem`|`Array`|`-`| `表示当前选中项的code数组`
`selectedArr`|`Array`|`-`| `表示所有选中项的二维code数组`