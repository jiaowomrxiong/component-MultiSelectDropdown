const hasOwn = {}.hasOwnProperty;
// 生成类名
function classNames(...args) {
    const classes = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg) continue;
        const argType = typeof arg;
        if (argType === 'string' || argType === 'number') {
            classes.push(arg);
        } else if (Array.isArray(arg) && arg.length) {
            const inner = classNames.apply(null, arg);
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
    return classes.join(' ');
}
// 阻止冒泡
function setStopPropagation(event) {
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
}

// 根据当前选中项确定子级选中状态
function handleChildrenStatus(obj, isSelected) {
    obj.selected = isSelected;
    obj.halfCheckd = null;
    if (obj.children && obj.children.length > 0) {
        obj.children.forEach(child => {
            handleChildrenStatus(child, isSelected);
        });
    }
}

// 通过新的selectedArr初始化或还原下拉框选中项，并根据选中项确定子级选中状态
function mapChannelBySelectedArr(channel, selectedArr) {
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
    if (channel.length > 0 && channel[0].code === 99999) {
        const channelTemp = channel.slice(1);
        channelTemp.every(ele => ele.selected) && (channel[0].selected = true);
        !channel[0].selected && channel.some(ele => (ele.selected || ele.halfCheckd)) && (channel[0].halfCheckd = true);
    }
}

export { classNames, setStopPropagation, handleChildrenStatus, mapChannelBySelectedArr };
