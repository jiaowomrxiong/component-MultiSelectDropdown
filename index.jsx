
/*
 * created by xiongfurong
 * 带搜索的多级多选下拉框
 * */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { classNames, setStopPropagation, mapChannelBySelectedArr } from './tool.js';
import './style.scss';
import GraceDropdown from './GraceDropdown';

class MultiGraceCataDropdown extends Component {
    static propTypes = {
        beforeSelect: PropTypes.func,
        channel: PropTypes.array,
        className: PropTypes.string,
        disabled: PropTypes.bool,
        handleClick: PropTypes.func,
        noDataContent: PropTypes.string,
        onChange: PropTypes.func,
        onSearchFilter: PropTypes.func,
        onSearchTextChange: PropTypes.func,
        openMethod: PropTypes.string,
        searchPlaceholder: PropTypes.string,
        searchText: PropTypes.string,
        selectedArr: PropTypes.array,
        selAllOption: PropTypes.object,
        toggleDom: PropTypes.array
    };

    static defaultProps = {
        beforeSelect: () => true,
        channel: [],
        className: '',
        disabled: false,
        handleClick: () => {},
        noDataContent: '暂无数据',
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
        toggleDom: [<span key='default-dom'></span>]
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
        this.state = this.initStateByDefault(this.props); // 根据props初始化组件中的state
        if (!this.state) this.state = {};
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (JSON.parse(JSON.stringify(this.state)) === JSON.parse(JSON.stringify(nextState)) && JSON.parse(JSON.stringify(nextProps)) === JSON.parse(JSON.stringify(this.props))) return false;
        return true;
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
        function getSelectedItems(ele) { // 递归 根据selectedArr筛选出需要保留的对象
            ele = ele.filter(item => {
                if (item.children && item.children.length > 0) item.children = getSelectedItems(item.children);
                return listStr.includes(item.code);
            });
            return ele;
        }
        selectedChannel = getSelectedItems(selectedChannel);
        return {
            pathList: selectedArr,
            currentItem: curCategory.selectedArr || [],
            channel: selectedChannel
        };
    }
    /**
     * 根据props初始化组件中的state
     * @param {object} config props配置信息
     * @returns {object} 初始化的组件state对象
     */
    initStateByDefault = config => {
        const {
                    channel,
                    selAllOption,
                    selectedArr,
                    onSearchFilter,
                    searchText
                } = config,
                curCategory = {
                    showName: '',
                    selectedArr: [],
                    colNum: 0
                },
                itemObj = {
                    itemArr0: JSON.parse(JSON.stringify(channel))
                },
                channelTemp = {},
                filteredArr = {},
                allOptionTemp = JSON.parse(JSON.stringify(selAllOption));
        if (channel.length < 0) return null;
        // 根据自定义搜索关键词给出搜索后的展示结果
        filteredArr.itemArr0 = onSearchFilter(JSON.parse(JSON.stringify(itemObj.itemArr0)), searchText);
        // 递归遍历对象取得最大级数
        function getMaxDeepth(obj) {
            if (!obj) return 0;
            let deepth = 0;
            for (let i = 0; i < obj.length; i++) deepth = Math.max(deepth, getMaxDeepth(obj[i].children));
            return 1 + deepth;
        }
        curCategory.colNum = getMaxDeepth(channel);
        // 过滤传入的selectedArr中的错误项，生成初始selectedArr
        let temSelectedArr = selectedArr && selectedArr.length !== 0 ? selectedArr : [[]];
        temSelectedArr = temSelectedArr.filter((arr, index) => {
            try {
                for (let i = 0; i < arr.length; i++) {
                    itemObj[`itemArr${i}`].every(item => {
                        if (item.code === arr[i]) {
                            curCategory[`itemArr${i}`] = item;
                            if (item.children && item.children.length > 0) itemObj[`itemArr${i + 1}`] = item.children;
                            return false;
                        }
                        return true;
                    });
                }
                return true;
            } catch (error) {
                console.warn(`Warning: It seems there are some problems with ${index + 1}th item in the given "selectedArr"!`);
                return false;
            }
        });
        // 不允许自定义‘全部’选项code，约定code为定值99999
        allOptionTemp.code = 99999;
        // 加入‘全部‘选项
        itemObj.itemArr0.length > 0 && itemObj.itemArr0.splice(0, 0, allOptionTemp);
        // 遍历将原始对象以code-obj方式平铺便于查找
        function mapChannel(obj) {
            obj.forEach(item => {
                channelTemp[item.code] = item;
                item.children && item.children.length > 0 && mapChannel(item.children);
            });
        }
        mapChannel(itemObj.itemArr0);
        // 先执行onChange事件回调，再执行render
        this.props.onChange(this.getCategorySelected(temSelectedArr, curCategory));
        // 最后生成下面这些东西，更新state
        return {
            curCategory, itemObj, channelTemp, searchText, filteredArr, selectedArr: temSelectedArr, allOption: allOptionTemp
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
                    curCategory
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
                                    halfCheckd: item.halfCheckd,
                                    'hover-bg': curCategory[`index${param.level}`] === index
                                }),
                                showCls = classNames({
                                    'show-i': item.children && item.children.length > 0
                                }),
                                checkCls = classNames({
                                    'item-half-checked': item.halfCheckd,
                                    'item-selected': item.selected
                                });
                        if (param.level === 0 && item.code === 99999) { // 在第一级中渲染加入’全部‘选项
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
        const {
            channelTemp
        } = this.state;
        selectedArr = selectedArr.filter(item => !item.includes(selection[level])); // 先去除selectedArr中的子级
        selectedArr.push(selection);
        for (let i = level - 1; i >= 0;) { // 从当前级数往前合并，判断父级是否已选中
            const codeTemp = selection[i];
            const childNum = selectedArr.filter(item => item.includes(codeTemp) && item.length === i + 2).length; // 过滤出原数组中的当前选中项的兄弟节点
            if (childNum === channelTemp[codeTemp].children.length) { // 若已选中节点数据与父级子节点数量相同，则表示父级已选中
                selectedArr = selectedArr.filter(item => !item.includes(codeTemp));
                selectedArr.push(selection.slice(0, i + 1));
                i--;
            } else { // 父级未选中 再上一级肯定未选中 则停止遍历
                i = -1;
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
        const {
            channelTemp
        } = this.state;
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
        !item.selected && this.state.itemObj.itemArr0.forEach(ele => { if (ele.code !== 99999) selectedArr.push([ele.code]); });
        // 根据当前选中状态拼接抛出数据
        this.setState({ selectedArr });
        this.props.onChange(this.getCategorySelected(selectedArr));
    }

    toggleCataBody = event => {
        if (this.props.disabled) return;
        setStopPropagation(event);
        this.props.handleClick(event);
    }
    /**
     * 搜索关键字变化的回调
     * @param {object} e 当前dom节点独享
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
                    className,
                    toggleDom,
                    openMethod,
                    onSearchFilter
                } = this.props,
                {
                    curCategory,
                    itemObj,
                    selectedArr,
                    filteredArr,
                    searchText
                } = this.state,
                curItem = searchText ? filteredArr : itemObj;
        if (!curItem) return null;
        mapChannelBySelectedArr(curItem.itemArr0, selectedArr);
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
            <div className={`multigrace-btn-group grace-multi-dropdown ${className}`} >
                <div
                    className={`grace-btn btn-primary dropdown-toggle ${disabled ? 'dropdown-disabled' : ''}`}
                    onClick={event => { if (tempOpenMethod === 'click') this.toggleCataBody(event); }}
                    onMouseOver={event => { if (tempOpenMethod === 'hover') this.toggleCataBody(event); }}
                >{toggleDom}
                </div>
                <div className='grace-multi-dropdown-body'>
                    <div
                        className='ul-wrap'
                        onClick={e => setStopPropagation(e)}
                    >{selectUlArr}
                    </div>
                </div>
            </div>
        );
    }
}

export default GraceDropdown(MultiGraceCataDropdown);
