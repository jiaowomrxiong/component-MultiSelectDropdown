
/*
 * created by xiongfurong
 * 带搜索的多级多选下拉框
 * */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from './tool.js';
import './style.scss';
import GraceDropdown from './GraceDropdown';

class MultiGraceCataDropdown extends Component {
    static propTypes = {
        beforeSelect: PropTypes.func,
        channel: PropTypes.array,
        className: PropTypes.string,
        disabled: PropTypes.bool,
        handleClick: PropTypes.func,
        noDataText: PropTypes.string,
        onChange: PropTypes.func,
        onSearchFilter: PropTypes.func,
        searchText: PropTypes.string,
        selectedArr: PropTypes.array
    };

    static defaultProps = {
        beforeSelect: () => true,
        channel: [],
        className: '',
        disabled: false,
        handleClick: () => {},
        noDataText: '暂无数据',
        onChange: () => {},
        // 默认根据name搜索
        onSearchFilter: (e, val) => {
            function itemFilter(items) {
                items = items.filter(item => {
                    if (item.children && item.children.length > 0) {
                        item.children = itemFilter(item.children);
                    }
                    if (item.children && item.children.length > 0) return true;
                    return item.name.indexOf(val) !== -1;
                });
                return items;
            }
            return itemFilter(e);
        },
        searchText: '请输入',
        selectedArr: []
    };

    static setStopPropagation(event) {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
    }

    // 初始化生成state
    static initStateByDefault(config) {
        if (!config.channel) return null;
        const temSelectedArr = MultiGraceCataDropdown.getSelectedArr(config);
        if (temSelectedArr) {
            return MultiGraceCataDropdown.createStateBySelectedArr(temSelectedArr, config);
        }
        return null;
    }

    // 获取默认选中项selectedArr，若没有 则默认选中末级第一项
    static getSelectedArr(config) {
        const {
                    channel,
                    selectedArr
                } = config,
                stateSelectedArr = [];
        // 递归遍历，选中末级第一项
        function getDefaultSel(arr) {
            if (arr.length <= 0) return;
            stateSelectedArr.push(arr[0].code);
            if (arr[0].children) {
                getDefaultSel(arr[0].children);
            }
        }
        if (selectedArr && selectedArr.length !== 0) {
            return selectedArr;
        }
        if (channel.length === 0) {
            return stateSelectedArr;
        }
        if (channel) {
            getDefaultSel(channel);
        }
        return [stateSelectedArr];
    }
    // 通过selectedArr生成State
    static createStateBySelectedArr(selectedArr, config) {
        const { channel } = config,
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
        // 递归遍历对象取得最大级数
        function getMaxDeepth(obj) {
            if (!obj) return 0;
            let deepth = 0;
            for (let i = 0; i < obj.length; i++) {
                deepth = Math.max(deepth, getMaxDeepth(obj[i].children));
            }
            return 1 + deepth;
        }
        curCategory.colNum = getMaxDeepth(channel);
        // 遍历将原始对象以code-obj方式平铺便于查找
        function mapChannel(obj) {
            obj.forEach(item => {
                channelTemp[item.code] = item;
                item.children && item.children.length > 0 && mapChannel(item.children);
            });
        }
        mapChannel(itemObj.itemArr0);
        // 到这里，selectedArr肯定是一个数据，长度>=0
        // 通过新的selectedArr初始化或还原下拉框选中项，并根据选中项确定子级选中状态
        selectedArr.forEach((arr, index) => {
            for (let i = 0; i < arr.length; i++) {
                itemObj['itemArr' + i].every(item => {
                    if (item.code === arr[i]) {
                        if (index === 0) {
                            curCategory['item' + i] = item;
                            curCategory.showName += i === 0 ? item.name : ` > ${item.name}`;
                        }
                        if (item.children && item.children.length > 0) {
                            itemObj['itemArr' + (i + 1)] = item.children;
                        } else {
                            item.selected = true;
                            // 根据当前选中项确定子级选中状态
                            MultiGraceCataDropdown.handleChildrenStatus(item, i, true);
                        }
                        return false;
                    }
                    return true;
                });
            }
        });
        // 根据子级选中状态确定父级选中状态
        itemObj.itemArr0.forEach(ele => {
            MultiGraceCataDropdown.handleParentStatus(ele);
        });
        // 根据当前选中状态拼接抛出数据
        const categorySelected = MultiGraceCataDropdown.getCategorySelected(itemObj.itemArr0);
        // 最后生成下面这些东西，更新state
        
        return {
            curCategory, itemObj, categorySelected, channelTemp, filteredArr
        };
    }

    // 根据当前选中项确定子级选中状态
    static handleChildrenStatus(obj, level, isSelected) {
        obj.selected = isSelected;
        if (obj.children && obj.children.length > 0) {
            obj.children.forEach(child => {
                MultiGraceCataDropdown.handleChildrenStatus(child, level + 1, isSelected);
            });
        }
    }

    // 根据子级选中状态确定父级选中状态
    static handleParentStatus(item) {
        if (item.children && item.children.length > 0) {
            item.children.forEach(cItem => {
                MultiGraceCataDropdown.handleParentStatus(cItem);
            });
            item.selected = item.children.every(cItem => cItem.selected);
            item.halfCheckd = !item.selected && item.children.some(cItem => cItem.selected);
        }
    }

    // 根据当前选中状态拼接抛出数据
    static getCategorySelected(itemArr) {
        let tempItems = [], tempCodes = [];
        const categorySelected = [];
        function getSelectedItems(ele, level) {
            ele.forEach(item => {
                tempItems = tempItems.slice(0, level);
                tempCodes = tempCodes.slice(0, level);
                tempItems[level] = item;
                tempCodes[level] = item.code;
                if (item.selected) {
                    categorySelected.push({
                        info: tempItems.slice(0),
                        code: tempCodes.slice(0)
                    });
                } else if (item.children && item.children.length > 0) {
                    getSelectedItems(item.children, level + 1);
                }
            });
        }
        getSelectedItems(itemArr, 0);
        return categorySelected;
    }

    constructor(props) {
        super(props);
        // 代表当前生成的数据是否需要跳转，即默认选中的数据，不在当前屏；
        // 数据还原或者初始化的时候，它的值才为true
        this.isInit = true;
        this.isMountedFlag = true;
        /**
         * 初始化state参数说明
         * curCategory 保存当前点击项的相关信息
         * itemObj 保存当前下拉框所展示的每一级的内容以‘itemArr + level’命名
         * categorySelected 抛出到组件外部的对象，包含所有已选中项的信息，以 选中项code为key，具体内容为value
         * channelTemp 保存原始channel铺平后的对象，以对象code为key
         * filteredArr 保存搜索框筛选后的对象，结构同itemObj
         */
        this.state = MultiGraceCataDropdown.initStateByDefault(this.props);
        if (!this.state) {
            this.state = {};
        } else {
            // 先执行onChange事件回调，再执行render
            this.props.onChange(this.state.categorySelected);
        }
    }

    // 什么时候需要调用 onChange这个回调方法？？？
    // 1、初始化的时候调用
    // 2、ajax的时候调用，
    // 3、还有更新props的channel，selectedArr的时候
    componentWillReceiveProps(nextProps) {
        if (JSON.stringify(nextProps.selectedArr) !== JSON.stringify(this.props.selectedArr)
            || (nextProps.channel !== null && this.props.channel === null)
            || JSON.stringify(nextProps.channel) !== JSON.stringify(this.props.channel)
        ) {
            if (nextProps.channel) {
                const temState = MultiGraceCataDropdown.initStateByDefault(nextProps);
                this.props.onChange(temState.categorySelected);
                if (temState) {
                    this.setState(temState);
                }
            }
        }
    }

    componentWillUnmount() {
        // 初始化的时候，就会触发这个，这个还得优化下，想想
        this.isMountedFlag = false;
    }


    // 根据curCategory来还原itemObj
    // 其实好像没必要，再考虑考虑是否去掉
    setStateByCurCategory = () => {
        this.isInit = true;
        const {
                    itemObj,
                    filteredArr,
                    searchVal,
                    curCategory
                } = this.state,
                tempObj = searchVal ? filteredArr : itemObj,
                indexObj = {};
        if (this.isMountedFlag) {
            for (let i = 0; i < curCategory.colNum; i++) {
                if (curCategory['item' + i] && curCategory['item' + i].children && curCategory['item' + i].children.length > 0) {
                    tempObj['itemArr' + (i + 1)] = curCategory['item' + i].children;
                } else {
                    tempObj['itemArr' + (i + 1)] = null;
                }
            }
            indexObj.tempObj = tempObj;
            this.setState(indexObj);
        }
    }

    // 在鼠标移入时触发，更新itemObj和curCategory
    mouseEnterFn = (e, item, level) => {
        clearTimeout(this.setTimeoutTimer);
        MultiGraceCataDropdown.setStopPropagation(e);
        const {
                    itemObj,
                    filteredArr,
                    searchVal,
                    curCategory
                } = this.state,
                tempObj = searchVal ? filteredArr : itemObj,
                tempState = {};
        for (let i = level + 1; i < curCategory.colNum; i++) {
            tempObj['itemArr' + i] = null;
        }
        if (level + 1 < curCategory.colNum) {
            tempObj['itemArr' + (level + 1)] = item.children && item.children.length > 0 ? item.children : null;
            tempState[searchVal ? 'filteredArr' : 'itemObj'] = tempObj;
        }
        this.setState(tempState);
    }

    allEnterHandler = () => {
        clearTimeout(this.setTimeoutTimer);
        this.setStateByCurCategory();
    }

    // 创建Dom
    createUlDom = param => (
        <ul key={param.level} ref={dom => { this[param.name] = dom; }} className={classNames({ 'dropdown-menu': true, 'single-dropdown': param.columsNum === 1 })}>
            {
                param.level === 0 ? (
                    <div className='search-input-wrapper'>
                        <input
                            onChange={e => this.dealSearchFilter(e)}
                            onClick={e => {
                                e.nativeEvent.stopImmediatePropagation();
                                e.stopPropagation();
                            }}
                            placeholder={this.props.searchText}
                            value={this.state.searchVal || ''}
                            className='search-input SZ_font sz-search'
                        />
                        <i className='SZ_font sz-search'></i>
                    </div>
                ) : <div />
            }
            {
                param.itemArr && param.itemArr.length > 0 ? param.itemArr.map(function (item) {
                    const selectedCls = classNames({
                                selected: item.selected,
                                halfCheckd: item.halfCheckd,
                                'disabled-bg disabled': item.disabled
                            }),
                            showCls = classNames({
                                'show-i': item.children && item.children.length > 0
                            }),
                            checkCls = classNames({
                                'SZ_font sz-minus': item.halfCheckd,
                                'SZ_font sz-check': item.selected
                            });
                    return (
                        <li key={item.code} className={`${selectedCls} ${item.className}`}>
                            <span
                                className='sel-option'
                                onMouseEnter={e => { this.mouseEnterFn(e, item, param.level); }}
                                onMouseLeave={this.mouseLeaveFn}
                                onClick={e => { this.changeCate(e, item, param.level); }}
                                title={item.name}
                            >
                                <span className={`check-icon ${checkCls}`} />
                                {item.name}
                                <i className={`${showCls} option-has-children`} />
                            </span>
                        </li>
                    );
                }, this) : (
                    <div
                        className='no-data-content'
                        onClick={e => MultiGraceCataDropdown.setStopPropagation(e)}
                    >{this.props.noDataText}
                    </div>
                )
            }
        </ul>
    );

    // 选项点击回调： item:当前项 level：当前层级
    changeCate = (e, item, level) => {
        MultiGraceCataDropdown.setStopPropagation(e);
        // 首先调用传入的beforeSelect，返回true则表示操作生效，继续下面的逻辑
        if (!this.props.beforeSelect(this.props.channel, item, level)) return;
        const tempCate = {
                    selectedArr: []
                },
                {
                    curCategory,
                    itemObj,
                    filteredArr,
                    searchVal,
                    channelTemp
                } = this.state;
        let tempItem = {};
        if (JSON.parse(JSON.stringify(itemObj)) !== JSON.parse(JSON.stringify(filteredArr))) {
            tempItem = channelTemp[item.code];
        } else {
            tempItem = item;
        }
        /**
         * 根据选中项更新curCategory
         */
        for (let i = 0; i <= level; i++) {
            if (i < level) {
                tempCate['item' + i] = curCategory['item' + i];
            } else if (i === level) {
                tempCate['item' + i] = tempItem;
                tempCate.selCode = tempItem.code;
            }
        }

        const isSelected = tempItem.selected;
        // 处理筛选结果的选中关系
        if (searchVal) {
            MultiGraceCataDropdown.handleChildrenStatus(item, level, !isSelected);
            filteredArr.itemArr0.forEach(ele => {
                MultiGraceCataDropdown.handleParentStatus(ele);
            });
        }
        // 处理原始数据的选中关系
        // 根据当前选中项确定子级选中状态
        MultiGraceCataDropdown.handleChildrenStatus(tempItem, level, !isSelected);
        // 根据子级选中状态确定父级选中状态
        itemObj.itemArr0.forEach(ele => {
            MultiGraceCataDropdown.handleParentStatus(ele);
        });
        tempCate.colNum = curCategory.colNum;
        // 根据当前选中状态拼接抛出数据
        const categorySelected = MultiGraceCataDropdown.getCategorySelected(itemObj.itemArr0);
        this.setState({
            curCategory: tempCate
        });
        this.props.onChange(categorySelected);
    }

    toggleCataBody = event => {
        MultiGraceCataDropdown.setStopPropagation(event);
        this.props.handleClick(event);
        this.setState({ searchVal: '' });
    }

    // 处理搜索框筛选逻辑
    dealSearchFilter = e => {
        const val = e.target.value,
                { itemObj } = this.state,
                filteredArr = {};
        filteredArr.itemArr0 = this.props.onSearchFilter(JSON.parse(JSON.stringify(itemObj.itemArr0)), val);
        this.setState({
            filteredArr,
            searchVal: val
        });
    }

    render() {
        const {
                    disabled,
                    className
                } = this.props,
                {
                    curCategory,
                    itemObj,
                    filteredArr,
                    searchVal
                } = this.state,
                curItem = searchVal ? filteredArr : itemObj;
        if (!curItem) return null;
        const selectUlArr = [],
                dropdownBodyCls = classNames({
                    'grace-multi-dropdown-body': true
                });
        for (let i = 0; i < curCategory.colNum; i++) {
            if(!curItem['itemArr' + i]) break;
            selectUlArr.push(this.createUlDom({
                itemArr: curItem['itemArr' + i],
                level: i,
                name: 'item' + i + 'Dom',
                columsNum: curCategory.colNum
            }));
        }
        return (
            <div className={`multigrace-btn-group grace-multi-dropdown ${className}`} >
                <div
                    className={`grace-btn btn-primary dropdown-toggle ${disabled ? 'dropdown-disabled' : ''}`}
                    onClick={event => {
                        if (disabled) return;
                        this.toggleCataBody(event);
                    }}
                >
                    <span className='SZ_font sz-plus'></span>
                </div>
                <div className={dropdownBodyCls}>
                    <div className='ul-wrap'>
                        {selectUlArr}
                    </div>
                </div>
            </div>
        );
    }
}

export default GraceDropdown(MultiGraceCataDropdown);
