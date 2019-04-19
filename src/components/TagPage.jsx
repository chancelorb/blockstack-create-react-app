import React, { Component } from 'react';
import { Redirect, withRouter } from 'react-router-dom';
import {
    loadUserData,
    Person,
    getFile,
    lookupProfile,
    putFile
} from 'blockstack';
import { Row, Col, Button } from 'react-bootstrap';
import Loader from './Loader';
import InfiniteScroll from './InfiniteScroll';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { currentUserInformation } from '../actions';
import Tag from '../model/tag';
import _ from 'lodash';

class TagPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            postIds: [],
            postIdAndName: {},
            tag: '',
            noPosts: false
        };
    }


    fetchData = async () => {
        const tag = this.props.match.params.tagName;
        this.setState({ isLoading: true, tag: tag, postIds: [] })
        let postTimes = [];
        let postIdAndName = {}
        try {
            let tags = await Tag.fetchList({ tag }, { decrypt: true })
            if (tags.length > 0) {
                for (let i = 0; i < tags.length; i++) {
                    postIdAndName[`${tags[i].attrs.createdAt}`] = [tags[i].attrs.username, tags[i].attrs.post_id];
                    postTimes.push(tags[i].attrs.createdAt)
                }
            } else {
                this.setState({isLoading: false, noPosts: true})
            }
        } catch {
        }
        return this.setState({
            isLoading: false,
            postIds: postTimes.reverse(),
            postIdAndName: postIdAndName,
        });
    }

    async componentDidMount() {
        this.fetchData();
    }

    render() {
        const { tag, isLoading, noPosts, postIds, postIdAndName } = this.state;
        if (this.props.match.params.tagName !== tag) { this.fetchData() }
        return (
            <div className='feed-container'>
                {isLoading && <Loader />}
                {!isLoading && <Row>
                    <Col md={1} xl={2}></Col>
                    <Col sm={12} md={10} xl={8}>
                        {noPosts && <h1>There are no posts for "{tag}"</h1>}
                        {!noPosts && 
                            <InfiniteScroll order={postIds} postIdAndName={postIdAndName} doneLoading={!isLoading} />
                        }
                    </Col>
                    <Col md={1} xl={2}></Col>
                </Row>}
            </div>
        );
    }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
    currentUserInformation
}, dispatch);

const mapStateToProps = (state) => {
    return ({
        curUserInfo: state.curuserInfo
    })
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(TagPage));