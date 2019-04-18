import React, {Component} from 'react';
import { Row, Col, Dropdown } from 'react-bootstrap';
import Comment from '../assets/comment.svg';
import { putFile, getFile } from 'blockstack';
import like from '../assets/like.svg';
import likeFull from '../assets/like-full.svg';
import Post from '../model/post';
import LikeInfo from '../model/like';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { Link } from 'react-router-dom';


class PostEngagement extends Component {
    constructor(props) {
        super(props);
        this.state = {
            postInfo: {},
            noLikeInfo: true,
            likeInfo: {
                post_id: '',
                username: '',
                liked: false
            },
            likeInfoModel: {},
            loaded: false
        }
    }

    handleLike = async() => {
        if (this.state.noLikeInfo) {
            const likeInfo = new LikeInfo({
                post_id: this.props.radiksId,
                username: this.props.curUserInfo.username,
                liked: true
            })
            const postInfo = this.state.postInfo
            postInfo.update({
                like_cnt: this.state.postInfo.attrs.like_cnt + 1
            })
            await postInfo.save()
            await likeInfo.save()
            this.loadPostInfo()
        } else {
            const likeInfo = this.state.likeInfoModel
            likeInfo.update({
                liked: !this.state.likeInfo.liked
            })
            const postInfo = this.state.postInfo
            this.state.likeInfo.liked ? postInfo.update({ like_cnt: this.state.postInfo.attrs.like_cnt - 1 }) : postInfo.update({ like_cnt: this.state.postInfo.attrs.like_cnt + 1 })
            await postInfo.save()
            await likeInfo.save()
            this.loadPostInfo()
        }
    }
    

    loadPostInfo = async() => {
        const postInfo = await Post.findById(this.props.radiksId);
        const likeInfo = await LikeInfo.fetchList({ username: this.props.curUserInfo.username, post_id: this.props.radiksId }, { decrypt: true });
        if (likeInfo < 1) {
            return this.setState({postInfo, loaded: true})
        } else {
            return this.setState({
                postInfo,
                likeInfo: likeInfo[0].attrs,
                noLikeInfo: false,
                likeInfoModel: likeInfo[0],
                loaded: true
            })
        }
    }

    componentDidMount() {
        this.loadPostInfo()
    }

    render() {
        return (
        <div className='post-engagement-con'>
            <Row >
                <Col xs={5}>
                    <Row >
                        <Col xs={{ span: 2, offset: 1 }}>
                                <img className='post-icon' src={!this.state.likeInfo.liked ? like : likeFull} alt='like' onClick={this.handleLike} />
                                {this.state.loaded && <p>{this.state.postInfo.attrs.like_cnt}</p>}
                        </Col>
                            <Col xs={2}><Link className='comment-link' to={`/post/${this.props.status.username}/${this.state.postInfo._id}`} onClick={() => { this.props.reload() }} ><img className='post-icon' src={Comment} alt='comment' />{this.state.loaded && <p>{this.state.postInfo.attrs.comment_cnt}</p>}</Link>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>)
    }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
    
}, dispatch);

const mapStateToProps = (state) => {
    return ({
        curUserInfo: state.curuserInfo
    })
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PostEngagement));