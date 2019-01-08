import React, { Component } from 'react';
import PropTypes from 'prop-types';

const GraceDropdown = WrappedComponent =>
    class extends Component {
        static propTypes = {
            isOpen: PropTypes.bool,
            notCloseWhenClickOther: PropTypes.bool
        };

        static defaultProps = {
            isOpen: false,
            notCloseWhenClickOther: false
        };

        constructor(props) {
            super(props);
            this.state = { isShow: this.props.isOpen };
            this.isComMounted = true;
            this.clickFn = this.clickFn.bind(this);
            this.closeDropdown = this.closeDropdown.bind(this);
        }
        componentWillUnmount() {
            // debugger 初始化的时候，就会触发这个，这个还得优化下，想想
            this.isComMounted = false;
        }
        clickFn() {
            if (this.state.isShow) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
        openDropdown() {
            if (!this.props.notCloseWhenClickOther) document.addEventListener('click', this.closeDropdown);
            this.setState({
                isShow: true
            });
        }
        closeDropdown() {
            if (this.props.notCloseWhenClickOther) document.removeEventListener('click', this.closeDropdown);
            if (this.isComMounted) {
                this.setState({
                    isShow: false
                });
            }
        }
        render() {
            const { isShow } = this.state;
            // 只要给它传递的props没有改变，那么我理解为这个组件就不会重新执行render！！！
            return (
                <div className={(isShow ? 'grace-dropdown-open' : '')} >
                    <WrappedComponent {...this.props} handleClick={this.clickFn} />
                </div>
            );
        }
    };
export default GraceDropdown;
