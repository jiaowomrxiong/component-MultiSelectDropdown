const hasOwn = {}.hasOwnProperty;
// 生成类名
function classNames(...args) {
    const classes = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg) {
            const argType = typeof arg;
            if (argType === 'string' || argType === 'number') {
                classes.push(arg);
            } else if (Array.isArray(arg) && arg.length) {
                const inner = classNames(...arg);
                if (inner) {
                    classes.push(inner);
                }
            } else if (argType === 'object') {
                for (const key in arg) {
                    if (hasOwn.call(arg, key) && arg[key]) {
                        classes.push(key);
                    }
                }
            }
        }
    }
    return classes.join(' ');
}
// 阻止冒泡
function setStopPropagation(event) {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
}

/**
 * 根据当前选中项确定子级选中状态
 * @param {array} obj 数组对象
 * @param {boolean} isSelected 表示是否已选中
 * @returns
 */
function handleChildrenStatus(obj, isSelected) {
    obj.selected = isSelected;
    obj.halfCheckd = null;
    if (obj.children && obj.children.length > 0) {
        obj.children.forEach(child => {
            handleChildrenStatus(child, isSelected);
        });
    }
}

/**
 * 通过新的selectedArr初始化或还原下拉框选中项，并根据选中项确定子级选中状态
 * @param {array} channel 数组对象
 * @param {array} selectedArr 已选中的数组
 * @returns
 */
function mapChannelBySelectedArr(channel, selectedArr, allOption) {
    // 先将所有选中状态清空
    function clearCheckStatus(obj) {
        obj.forEach(item => {
            item.selected = false;
            item.halfCheckd = false;
            if (item.children && item.children.length > 0) clearCheckStatus(item.children);
        });
    }
    // 根据selectedArr确定channel选中状态
    function setCheckStatus(obj, level) {
        obj.forEach(item => {
            selectedArr.forEach(arr => {
                if (arr.length > level && item.code === arr[level]) {
                    if (level === arr.length - 1) {
                        item.selected = true;
                        // 根据当前选中项确定子级选中状态
                        handleChildrenStatus(item, true);
                    } else {
                        item.halfCheckd = true;
                    }
                }
            });
            if (item.children && item.children.length > 0) setCheckStatus(item.children, level + 1);
        });
    }
    clearCheckStatus(channel);
    setCheckStatus(channel, 0);
    // 确定’全部‘选项选中状态
    if (channel.length > 0 && channel[0].code === allOption.code) {
        const channelTemp = channel.slice(1);
        channelTemp.every(ele => ele.selected) && (channel[0].selected = true);
        !channel[0].selected && channel.some(ele => (ele.selected || ele.halfCheckd)) && (channel[0].halfCheckd = true);
    }
}
/**
 * 递归遍历对象取得最大级数
 * @param {array} obj 需要遍历的数组对象
 * @returns {number} 最大级数
 */
function getMaxDeepth(obj) {
    if (!obj) return 0;
    let deepth = 0;
    for (let i = 0; i < obj.length; i++) deepth = Math.max(deepth, getMaxDeepth(obj[i].children));
    return 1 + deepth;
}
/**
 * 遍历将原始对象以code-obj方式平铺便于查找
 * @param {array} obj 原数组对象
 * @param {object} channelObj 平铺后的对象
 * @returns
 */
function mapChannel(obj, channelObj) {
    obj.forEach(item => {
        channelObj[item.code] = item;
        item.children && item.children.length > 0 && mapChannel(item.children, channelObj);
    });
}
/**
 * 递归 根据selectedArr筛选出需要保留的对象
 * @param {array} channel 需要筛选的数组对象
 * @param {string} listStr 数组化的选中数组
 * @returns {array} 筛选后的数组对象
 */
function getSelectedItems(channel, listStr) {
    channel = channel.filter(item => {
        if (item.children && item.children.length > 0) item.children = getSelectedItems(item.children, listStr);
        return listStr.includes(item.code);
    });
    return channel;
}
export { classNames, setStopPropagation, handleChildrenStatus, mapChannelBySelectedArr, getMaxDeepth, mapChannel, getSelectedItems };
