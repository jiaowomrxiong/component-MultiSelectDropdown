
/*
 * created by xiongfurong
 * 带搜索的多级多选下拉框
 * */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { classNames, setStopPropagation, mapChannelBySelectedArr, getMaxDeepth, mapChannel, getSelectedItems } from './tools/tool';
import './style/style.scss';

class MultiGraceCataDropdown extends Component {
    static propTypes = {
        beforeSelect: PropTypes.func,
        channel: PropTypes.array,
        className: PropTypes.string,
        disabled: PropTypes.bool,
        isOpen: PropTypes.bool,
        noDataContent: PropTypes.string,
        notCloseWhenClickOther: PropTypes.bool,
        onChange: PropTypes.func,
        onSearchFilter: PropTypes.func,
        onSearchTextChange: PropTypes.func,
        openMethod: PropTypes.string,
        searchPlaceholder: PropTypes.string,
        searchText: PropTypes.string,
        selectedArr: PropTypes.array,
        selAllOption: PropTypes.object,
        buttonContent: PropTypes.node
    };

    static defaultProps = {
        beforeSelect: () => true,
        channel: [],
        className: '',
        disabled: false,
        isOpen: false,
        noDataContent: '暂无数据',
        notCloseWhenClickOther: false,
        onChange: e => console.log(e),
        // 默认根据name搜索
        onSearchFilter: (channel, val) => {
            function itemFilter(items) {
                items = items.filter(item => {
                    if (item.children && item.children.length > 0) item.children = itemFilter(item.children);
                    if (item.children && item.children.length > 0) return true;
                    return item.name.indexOf(val) !== -1;
                });
                return items;
            }
            return itemFilter(channel);
        },
        onSearchTextChange: text => text,
        openMethod: 'click',
        searchPlaceholder: '请输入',
        searchText: '',
        selectedArr: [],
        selAllOption: {
            code: 99999,
            name: '全部'
        },
        buttonContent: [<span key='default-dom'></span>]
    };

    constructor(props) {
        super(props);
        /**
         * 初始化state参数说明
         * curCategory 保存当前点击项的相关信息
         * itemObj 保存当前下拉框所展示的每一级的内容以‘itemArr + level’命名
         * channelTemp 保存原始channel铺平后的对象，以对象code为key
         * filteredArr 保存搜索框筛选后的对象，结构同itemObj
         * selectedArr 保存组件中的选中状态
         */
        this.state = this.initStateByDefault(); // 根据props初始化组件中的state
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !(JSON.parse(JSON.stringify(this.state)) === JSON.parse(JSON.stringify(nextState)) && JSON.parse(JSON.stringify(nextProps)) === JSON.parse(JSON.stringify(this.props)));
    }
    /**
     * 根据当前选中状态拼接抛出数据
     * @param {array} selectedArr 所有选中项的数组
     * @param {object} curCategory 当前操作项信息
     * @returns {object} 传递到组件外的对象
     */
    getCategorySelected = (selectedArr = [], curCategory = {}) => {
        const listStr = selectedArr.toString().split(',');
        let selectedChannel = JSON.parse(JSON.stringify(this.props.channel));
        selectedChannel = getSelectedItems(selectedChannel, listStr);
        return {
            selectedArr,
            currentItem: curCategory.selectedArr || [],
            channel: selectedChannel
        };
    }
    /**
     * 根据props初始化组件中的state
     * @returns {object} 初始化的组件state对象
     */
    initStateByDefault = () => {
        const {
                    channel,
                    selAllOption,
                    selectedArr,
                    onSearchFilter,
                    searchText,
                    isOpen
                } = this.props,
                curCategory = {
                    showName: '',
                    selectedArr: [],
                    colNum: 0
                },
                itemObj = {
                    itemArr0: JSON.parse(JSON.stringify(channel))
                },
                channelTemp = {},
                filteredArr = {};
        if (channel.length < 0) return {};
        // 根据自定义搜索关键词给出搜索后的展示结果
        filteredArr.itemArr0 = onSearchFilter(JSON.parse(JSON.stringify(itemObj.itemArr0)), searchText);
        // 递归遍历对象取得最大级数
        curCategory.colNum = getMaxDeepth(channel);
        // 过滤传入的selectedArr中的错误项，生成初始selectedArr
        let temSelectedArr = selectedArr && selectedArr.length !== 0 ? selectedArr : [[]];
        temSelectedArr = temSelectedArr.filter(arr => {
            for (let i = 0; i < arr.length; i++) {
                if (!itemObj[`itemArr${i}`]) return false;
                itemObj[`itemArr${i}`].every(item => {
                    if (item.code === arr[i]) {
                        curCategory[`itemArr${i}`] = item;
                        if (item.children && item.children.length > 0) itemObj[`itemArr${i + 1}`] = item.children;
                        return false;
                    }
                    return true;
                });
                if (i === arr.length - 1) {
                    const returnVal = itemObj[`itemArr${i}`].some(item => item.code === arr[i]);
                    for (let k = 1; k < arr.length; k++) {
                        itemObj[`itemArr${k}`] = null;
                    }
                    return returnVal;
                }
            }
            return false;
        });
        // 加入‘全部‘选项
        const allOptionTemp = JSON.parse(JSON.stringify(selAllOption));
        itemObj.itemArr0.length > 0 && itemObj.itemArr0.splice(0, 0, allOptionTemp);
        // 遍历将原始对象以code-obj方式平铺便于查找
        mapChannel(itemObj.itemArr0, channelTemp);
        // 先执行onChange事件回调，再执行render
        this.props.onChange(this.getCategorySelected(temSelectedArr, curCategory));
        // 最后生成下面这些东西，更新state
        return {
            curCategory, itemObj, channelTemp, searchText, filteredArr, isOpen, selectedArr: temSelectedArr, allOption: allOptionTemp
        };
    }
    /**
     * 鼠标移入下拉框选项的回调
     * @param {object} e 当前dom节点独享
     * @param {object} item 当前项对象
     * @param {number} level 当前项级数
     * @param {number} index 当前项在下拉框中的index
     * @returns
     */
    mouseEnterFn = (e, item, level, index) => {
        clearTimeout(this.setTimeoutTimer);
        setStopPropagation(e);
        const {
                    itemObj,
                    filteredArr,
                    searchText,
                    curCategory
                } = this.state,
                tempObj = searchText ? filteredArr : itemObj,
                tempState = {};
        // 先将当前级数之后的级数都制空
        for (let i = level + 1; i < curCategory.colNum; i++) {
            tempObj[`itemArr${i}`] = null;
            curCategory[`index${i}`] = null;
            curCategory[`itemArr${i}`] = null;
        }
        if (level + 1 < curCategory.colNum) {
            tempObj[`itemArr${level + 1}`] = item.children && item.children.length > 0 ? item.children : null;
            tempState[searchText ? 'filteredArr' : 'itemObj'] = tempObj;
        }
        curCategory[`index${level}`] = index;
        curCategory[`itemArr${level}`] = item;
        tempState.curCategory = curCategory;
        // 更新state中的itemObj和curCategory
        this.setState(tempState);
    }
    /**
     * 下拉框Dom创建函数
     * @param {object} param 下拉框列表对象
     * @returns reactDom
     */
    createUlDom = param => {
        const {
                    searchText,
                    curCategory,
                    allOption
                } = this.state,
                {
                    searchPlaceholder,
                    noDataContent
                } = this.props;
        return (
            <ul
                key={param.level}
                ref={dom => { this[param.name] = dom; }}
                className={classNames({ 'dropdown-menu': true, 'single-dropdown': param.columsNum === 1 })}
            >
                { // 在第一级中加入input搜索框
                    param.level === 0 ? (
                        <div className='search-input-wrapper' >
                            <i className='search-input-icon' />
                            <input
                                onChange={e => this.dealSearchFilter(e)}
                                placeholder={searchPlaceholder}
                                value={searchText || ''}
                                className='search-input'
                            />
                            <i
                                className={`input-clear-icon ${searchText ? 'show-clear' : ''}`}
                                onClick={() => this.setState({ searchText: '' })}
                            />
                        </div>
                    ) : <div />
                }
                {
                    param.itemArr && param.itemArr.length > 0 ? param.itemArr.map(function (item, index) {
                        const selectedCls = classNames({
                                    selected: item.selected,
                                    halfCheckd: !item.selected && item.halfCheckd,
                                    'hover-bg': curCategory[`index${param.level}`] === index
                                }),
                                showCls = classNames({
                                    'show-i': item.children && item.children.length > 0
                                }),
                                checkCls = classNames({
                                    'item-half-checked': !item.selected && item.halfCheckd,
                                    'item-selected': item.selected
                                });
                        if (param.level === 0 && item.code === allOption.code) { // 在第一级中渲染加入’全部‘选项
                            return (
                                <li key={item.code} className={`${selectedCls} ${item.className}`}>
                                    <span
                                        className='sel-option'
                                        onClick={e => this.changeAllOption(e, item)}
                                        onMouseEnter={e => { this.mouseEnterFn(e, item, param.level, index); }}
                                        onMouseLeave={this.mouseLeaveFn}
                                        title={item.name}
                                    >
                                        <span className={`check-icon ${checkCls}`} ><i /></span>
                                        {item.name}
                                    </span>
                                </li>
                            );
                        }
                        return (
                            <li key={item.code} className={`${selectedCls} ${item.className}`}>
                                <span
                                    className='sel-option'
                                    onMouseEnter={e => { this.mouseEnterFn(e, item, param.level, index); }}
                                    onMouseLeave={this.mouseLeaveFn}
                                    onClick={e => { this.changeCate(e, item, param.level); }}
                                    title={item.name}
                                >
                                    <span className={`check-icon ${checkCls}`} ><i /></span>
                                    {item.name}
                                    <i className={`${showCls} option-has-children`} />
                                </span>
                            </li>
                        );
                    }, this) : (
                        <div className='no-data-content' >
                            <span className='no-data-left' />
                            {noDataContent}
                            <span className='no-data-right' />
                        </div>
                    )
                }
            </ul>
        );
    }
    /**
     * 往selectedArr中添加一项
     * @param {array} selectedArr 所有选中项的数组
     * @param {array} selection 当前选中项的code数组
     * @param {number} level 当前操作项级数
     * @returns {array} 处理后的所有选中项的数组
     */
    addSelection = (selectedArr, selection, level) => {
        const { channelTemp } = this.state;
        selectedArr = selectedArr.filter(item => !item.includes(selection[level])); // 先去除selectedArr中的子级
        selectedArr.push(selection);
        for (let i = level - 1; i >= 0; i--) { // 从当前级数往前合并，判断父级是否已选中
            const codeTemp = selection[i];
            const childNum = selectedArr.filter(item => item.includes(codeTemp) && item.length === i + 2).length; // 过滤出原数组中的当前选中项的兄弟节点
            if (childNum === channelTemp[codeTemp].children.length) { // 若已选中节点数据与父级子节点数量相同，则表示父级已选中
                selectedArr = selectedArr.filter(item => !item.includes(codeTemp));
                selectedArr.push(selection.slice(0, i + 1));
            } else { // 父级未选中 再上一级肯定未选中 则停止遍历
                break;
            }
        }
        return selectedArr;
    }
    /**
     * 删除selectedArr中的一项
     * @param {array} selectedArr 所有选中项的数组
     * @param {array} selection 当前选中项的code数组
     * @param {number} level 当前操作项级数
     * @returns {array} 处理后的所有选中项的数组
     */
    cancelSelection = (selectedArr, selection, level) => {
        const { channelTemp } = this.state;
        selectedArr = selectedArr.filter(item => !item.includes(selection[level])); // 先去除selectedArr中的子级
        for (let i = 0; i < level; i++) {
            const codeTemp = selection[i];
            selectedArr.every((item, index) => { // 检查取消前父级是否已选中，已选中则删除父级并加入兄弟节点
                if (item.includes(codeTemp) && item.length === i + 1) {
                    selectedArr.splice(index, 1);
                    const tempArr = selection.slice(0, i + 1);
                    channelTemp[codeTemp].children.forEach(ele => {
                        if (ele.code !== selection[level]) selectedArr.push(tempArr.concat([ele.code]));
                    });
                    return false;
                }
                return true;
            });
        }
        return selectedArr;
    }
    /**
     * 点击下拉选项的回调
     * @param {object} e 当前dom节点独享
     * @param {object} item 当前项对象
     * @param {number} level 当前项级数
     * @returns
     */
    changeCate = (e, item, level) => {
        setStopPropagation(e);
        // 首先调用传入的beforeSelect，返回true则表示操作生效，继续下面的逻辑
        if (!this.props.beforeSelect(this.props.channel, item, level)) return;
        const {
                    curCategory,
                    selectedArr
                } = this.state,
                selection = [];
        // 根据操作项更新curCategory,并获取当前项的codeList
        for (let i = 0; i <= level; i++) {
            if (i > level) curCategory[`itemArr${i}`] = null;
            else if (i === level) {
                curCategory[`itemArr${i}`] = item;
                curCategory.selCode = item.code;
                selection.push(item.code);
            } else selection.push(curCategory[`itemArr${i}`].code);
        }
        // 根据当前项的选中状态判断是‘选中’操作还是‘取消’操作
        const arrTemp = !item.selected ? this.addSelection(selectedArr, selection, level) : this.cancelSelection(selectedArr, selection, level);
        curCategory.selectedArr = selection;
        this.setState({
            curCategory,
            selectedArr: arrTemp
        });
        this.props.onChange(this.getCategorySelected(arrTemp, curCategory));
    }
    /**
     * 点击’全部‘选项的回调
     * @param {object} e 当前dom节点独享
     * @param {object} item 当前项对象
     * @returns
     */
    changeAllOption = (e, item) => {
        setStopPropagation(e);
        const selectedArr = [];
        !item.selected && this.state.itemObj.itemArr0.forEach(ele => { if (ele.code !== this.state.allOption.code) selectedArr.push([ele.code]); });
        // 根据当前选中状态拼接抛出数据
        this.setState({ selectedArr });
        this.props.onChange(this.getCategorySelected(selectedArr));
    }
    /**
     * 切换下拉列表展示与隐藏
     * @param {object} event 当前dom节点独享
     * @returns
     */
    toggleCateBody = event => {
        if (this.props.disabled) return;
        setStopPropagation(event);
        if (this.state.isOpen && !this.timer) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    openDropdown = () => {
        clearTimeout(this.timer);
        this.timer = null;
        document.querySelectorAll('.grace-multi-dropdown-open').forEach(el => el.click()); // 关闭页面上其他多选组件
        if (!this.props.notCloseWhenClickOther) document.addEventListener('click', this.closeDropdown);
        this.setState({ isOpen: true });
    }
    closeDropdown = () => {
        if (!this.props.notCloseWhenClickOther) document.removeEventListener('click', this.closeDropdown);
        if (this.props.openMethod === 'click') this.setState({ isOpen: false });
        if (this.props.openMethod === 'hover') {
            this.timer = setTimeout(() => {
                this.setState({ isOpen: false });
                clearTimeout(this.timer);
                this.timer = null;
            }, 300);
        }
    }
    /**
     * 搜索关键字变化的回调
     * @param {object} e 当前dom节点对象
     * @returns
     */
    dealSearchFilter = e => {
        const val = this.props.onSearchTextChange(e.target.value),
                { itemObj } = this.state,
                filteredArr = {};
        filteredArr.itemArr0 = this.props.onSearchFilter(JSON.parse(JSON.stringify(itemObj.itemArr0)), val);
        this.setState({
            filteredArr,
            searchText: val
        });
    }
    render() {
        const {
                    disabled,
                    buttonContent,
                    openMethod,
                    onSearchFilter,
                    className
                } = this.props,
                {
                    curCategory,
                    itemObj,
                    selectedArr,
                    filteredArr,
                    searchText,
                    allOption,
                    isOpen
                } = this.state,
                curItem = searchText ? filteredArr : itemObj;
        if (!curItem) return null;
        mapChannelBySelectedArr(curItem.itemArr0, selectedArr, allOption);
        searchText && (curItem.itemArr0 = onSearchFilter(curItem.itemArr0, searchText));
        const selectUlArr = [],
                tempOpenMethod = openMethod === 'click' || openMethod === 'hover' ? openMethod : 'click';
        for (let i = 0; i < curCategory.colNum; i++) {
            if (!curItem[`itemArr${i}`]) break;
            selectUlArr.push(this.createUlDom({
                itemArr: curItem[`itemArr${i}`],
                level: i,
                name: `item${i}Dom`,
                columsNum: curItem.itemArr0.length > 0 ? curCategory.colNum : 1
            }));
        }
        return (
            <div className={`${isOpen ? 'grace-multi-dropdown-open' : ''} ${className}`} >
                <div
                    className='multigrace-btn-group grace-multi-dropdown'
                    onClick={event => { if (tempOpenMethod === 'click') this.toggleCateBody(event); }}
                    onMouseEnter={event => { if (tempOpenMethod === 'hover') this.toggleCateBody(event); }}
                    onMouseLeave={event => { if (tempOpenMethod === 'hover') this.toggleCateBody(event); }}
                >
                    <div className={`grace-btn btn-primary dropdown-toggle ${disabled ? 'dropdown-disabled' : ''}`} >
                        {buttonContent}
                    </div>
                    <div className='grace-multi-dropdown-body'>
                        <div
                            className='ul-wrap'
                            onClick={e => setStopPropagation(e)}
                        >{selectUlArr}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MultiGraceCataDropdown;
