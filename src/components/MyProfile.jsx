import React, { Component } from 'react';
import {
    loadUserData,
    getFile,
    putFile,
} from 'blockstack';
import { Row, Col, ListGroup, Button, Form, InputGroup, FormControl } from 'react-bootstrap';
import backPic from '../assets/standard-wallpaper.jpg';
import settingsIcon from '../assets/settings.svg';
import cameraIcon from '../assets/camera.svg';
import usersIcon from '../assets/users.svg';
import UserInfo from './UserInfo';
import InfiniteScroll from './InfiniteScroll';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { currentUserInformation, addToCurrentUserPosts } from '../actions';
import { withRouter } from 'react-router-dom';
import Post from '../model/post';
import Tag from '../model/tag';
import Like from '../model/like';
import _ from 'lodash';
const uuidv4 = require('uuid/v4');


class MyProfile extends Component {
    constructor(props) {
        super(props);
        this.state = {
            newStatus: "",
            isLoading: false,
            changeInfo: false,
            newImage: false,
            settings: {
                backgroundImage: false,
            },
            displayFriends: false,
            tags: "",
            displayPosts: true,
            displayComments: false,
            displayReplies: false,
            commentTimes: [],
            commentIDAndName: {},
            displayLiked: false
        };
        this.handleNewStatusChange = this.handleNewStatusChange.bind(this);
        this.handleNewStatusSubmit = this.handleNewStatusSubmit.bind(this);
        this.saveNewStatus = this.saveNewStatus.bind(this);
    }

    isLocal = () => {
        return this.props.match.params.username === loadUserData().username ? true : false;
    }

    fetchData = async () => {
        let postTimes = [];
        let postIdAndName = {}
        let settings = await this.fetchSettings();
        try {
            let postsMadeByUser = await Post.fetchList({ username: this.props.curUserInfo.username, is_post: true }, { decrypt: true })
            if (postsMadeByUser.length > 0) {
                for (let i = 0; i < postsMadeByUser.length; i++) {
                    postIdAndName[`${postsMadeByUser[i].attrs.createdAt}`] = [this.props.curUserInfo.username, postsMadeByUser[i]._id];
                    postTimes.push(postsMadeByUser[i].attrs.createdAt)
                }
            }
        } catch (e) {
            console.log(`Couldn't fetch postids. message: ${e}`)
        } 
        return [this.props.addToCurrentUserPosts(postTimes.reverse(), postIdAndName) ,this.setState({
            isLoading: false,
            displayPosts: true,
            settings: settings,
            displayComments: false,
            displayReplies: false,
        })];
    }
    fetchSettings = () => {
        const options = { decrypt: false }
        return getFile('settings.json', options)
            .then((file) => {
                let settings = JSON.parse(file || false)
                return settings ? settings : this.state.settings
            })
    }

    async saveNewStatus() {
        let text = this.state.newStatus.trim();
        if (text.length === 0) {return false};
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
        text = text.replace(/ +(?= )/g, '')
        let createdAt = Date.now();
        const id = uuidv4();
        const options = { encrypt: false }

        let post = {
            id: id,
            text: text,
            created_at: createdAt,
            image: this.state.newImage,
            imageUrl: this.props.curUserInfo.person.avatarUrl(),
            username: this.props.curUserInfo.username,
            fullName: this.props.curUserInfo.person.name()
        }
        const radiksPost = new Post({
            _id: id,
            username: this.props.curUserInfo.username,
            is_post: true,
            is_repost: false,
            is_comment: false,
            original_post_id: id,
        })
        
        try {
            await putFile(`post${id}.json`, JSON.stringify(post), options)
            await radiksPost.save()
            const tagArray = _.uniq(_.split(this.state.tags, ' '));
            if (tagArray.length > 0) {
                for (let i = 0; i < tagArray.length; i++) {
                    if (tagArray[i].length > 0) {
                        const tag = new Tag({
                            tag: tagArray[i],
                            post_id: id,
                            username: this.props.curUserInfo.username,
                        })
                        tag.save()
                    }
                }
            }
        } catch {
            console.log('somehthing went wrong with creating the post please try again')
        }
        return [this.setState({ isLoading: true, newStatus: "", tags: "", newImage: false}), this.fetchData()]
    }

    handleNewStatusChange(event) {
        this.setState({ [event.target.name]: event.target.value })
    }
    captureFile = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
            this.setState({newImage: `data:image/jpeg;base64,${Buffer(reader.result).toString("base64")}`});
        };
    };
    captureFileBackground = (event) => {
        event.preventDefault();
        const file = event.target.files[0];
        const reader = new window.FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
            this.setState({ 
                settings: {
                    backgroundImage: `data:image/jpeg;base64,${Buffer(reader.result).toString("base64")}`
                }
            });
        };
    }
    defaultBackground = (event) => {
        event.preventDefault();
        this.setState({
            settings: {
                backgroundImage: false
            }
        })
    }

    handleNewStatusSubmit(event) {
        event.preventDefault();
        this.saveNewStatus();
    }
    deleteImage = () => {
        this.setState({ newImage: false})
    }

    componentDidMount() {
        if (!this.props.curUserOwnPosts.loaded) { this.fetchData()};
    }

    logUserInfo = () => {
        console.log(loadUserData());
    }
    toggleSettings = () => {
        console.log('toggleSettings', this.props.curUserInfo.name)
        this.setState({changeInfo: !this.state.changeInfo})
    }
    saveSettings = () => {
        let settings = this.state.settings

        const options = { encrypt: false }
        putFile('settings.json', JSON.stringify(settings), options)
        .then(() => {
            this.setState({
                changeInfo: false
            })
        })
    }
    handleFilterPosts = async(filterOption) => {
        this.setState({ isLoading: true, 
            displayPosts: false,
            displayComments: false,
            displayReplies: false, 
            displayLiked: false
        });
        if (filterOption === 'posts') {
            this.fetchData()
        } else if (filterOption === 'comments') {
            let postTimes = [];
            let postIdAndName = {}
            try {
                let postsMadeByUser = await Post.fetchList({ username: this.props.curUserInfo.username, is_comment: true }, { decrypt: true })
                if (postsMadeByUser.length > 0) {
                    for (let i = 0; i < postsMadeByUser.length; i++) {
                        postIdAndName[`${postsMadeByUser[i].attrs.createdAt}`] = [this.props.curUserInfo.username, postsMadeByUser[i]._id];
                        postTimes.push(postsMadeByUser[i].attrs.createdAt)
                    }
                }
            } catch (e) {
                console.log(`Couldn't fetch postids. message: ${e}`)
            }
            console.log({postIdAndName, postTimes: postTimes.reverse()})
            return this.setState({
                isLoading: false,
                commentTimes: postTimes.reverse(),
                commentIDAndName: postIdAndName,
                displayComments: true,
                displayReplies: false,
                displayLiked: false
            })
        } else if (filterOption === 'replies') {
            let postTimes = [];
            let postIdAndName = {}
            try {
                let postsMadeByUser = await Post.fetchList({ original_poster_username: this.props.curUserInfo.username, is_comment: true }, { decrypt: true })
                if (postsMadeByUser.length > 0) {
                    for (let i = 0; i < postsMadeByUser.length; i++) {
                        postIdAndName[`${postsMadeByUser[i].attrs.createdAt}`] = [postsMadeByUser[i].attrs.username, postsMadeByUser[i]._id];
                        postTimes.push(postsMadeByUser[i].attrs.createdAt)
                    }
                }
            } catch (e) {
                console.log(`Couldn't fetch postids. message: ${e}`)
            }
            return this.setState({
                isLoading: false,
                commentTimes: postTimes.reverse(),
                commentIDAndName: postIdAndName,
                displayComments: false,
                displayReplies: true,
                displayLiked: false
            })
        }
        else if (filterOption === 'liked') {
            let postTimes = [];
            let postIdAndName = {}
            try {
                let postsLikedByUser = await Like.fetchList({ username: this.props.curUserInfo.username, liked: true }, { decrypt: true })
                console.log({postsLikedByUser})
                if (postsLikedByUser.length > 0) {
                    for (let i = 0; i < postsLikedByUser.length; i++) {
                        const curpost = await Post.findById(postsLikedByUser[i].attrs.post_id);
                        postIdAndName[`${curpost.attrs.createdAt}`] = [curpost.attrs.username, curpost._id];
                        postTimes.push(curpost.attrs.createdAt)
                    }
                }
            } catch (e) {
                console.log(`Couldn't fetch postids. message: ${e}`)
            }
            return this.setState({
                isLoading: false,
                commentTimes: postTimes.reverse(),
                commentIDAndName: postIdAndName,
                displayComments: false,
                displayReplies: false,
                displayLiked: true
            })
            // username: { type: String, decrypted: true },
            // liked
        }
    }
    displayFriends = () => {
        this.setState({displayFriends: !this.state.displayFriends})
    }
    

    render() {
        const { person, username, friends } = this.props.curUserInfo;
        const backgroundStyle = {
            'backgroundImage': `url("${this.state.settings.backgroundImage ? this.state.settings.backgroundImage : backPic}"`
        }
        const selectedStyle = {
            'backgroundColor': '#ffffff'
        }
        const notSelectedStyle = {
            'backgroundColor': '#f9f9f9'
        }
        const postStyle = this.state.displayPosts ? selectedStyle : {};
        const commentStyle = this.state.displayComments ? selectedStyle : {};
        const replyStyle = this.state.displayReplies ? selectedStyle : {};
        const likedStyle = this.state.displayLiked ? selectedStyle : {};
        const settingsForm = (<div className="new-status settings">
            <Row>
                <Col md={12}>
                    <Form>
                        <Form.Group as={Row} controlId="formPlaintextEmail">
                            <Form.Label column sm="12">
                                To change the display name, image or bio press <a target='_blank' href='https://browser.blockstack.org/profiles' rel="noopener noreferrer" >here</a>.<br/>
                                Please log out, and back in after you make changes.
                            </Form.Label>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formPlaintextPassword">
                            <Form.Label column sm="3">
                                Background image
                            </Form.Label>
                            <Col sm="9">
                                <label className="btn btn-outline-success">
                                    Upload <input type="file" onChange={this.captureFileBackground} hidden />
                                </label>
                                {'     '}
                                <label className="btn btn-outline-danger" onClick={this.defaultBackground}>
                                    Default
                                </label>
                            </Col>
                        </Form.Group>
                        <hr />
                        <Button variant="success" onClick={this.saveSettings}>
                            Save
                        </Button>
                        {'     '}
                        <Button variant="danger" onClick={this.toggleSettings}>
                            Cancel
                        </Button>
                    </Form>
                </Col>
            </Row>
        </div>);
        const friendDisplay = friends.length > 0 ? (<div className='profile-posts'>
            <div className="my-post"><h1>Friends</h1>
            <ListGroup variant="flush">
            {friends.map((friend) => (
                <div className="my-friend" key={friend}>
                    <Row>
                        <Col xs={12}>
                            <ListGroup.Item onClick={() => { this.props.searchFor(friend) }}>{friend}</ListGroup.Item>
                        </Col>
                    </Row>
                </div>
            )
                    )}</ListGroup></div>
        </div>) : (
                <div className='profile-posts'>
                    <div className="my-post"><h1>Friends</h1>
                        <ListGroup variant="flush">
                            <Row>
                                <Col xs={12}>
                                <ListGroup.Item>You don't have any friends yet.</ListGroup.Item>
                                </Col>
                            </Row>
                        </ListGroup>
                    </div>
                </div>);
        return (
            <div>
            {person &&
                <div className="container-myprofile">
                    <div className='container-desc-prof'>
                    <div style={backgroundStyle} className="background-image"></div>
                    <UserInfo person={person} username={username} />
                    <div className='myprofile-options'>
                            <Row className='my-options' >
                                <Col xs={3}>
                                    
                                </Col>
                                <Col xs={1}>
                                    <img src={settingsIcon} 
                                    onClick={this.toggleSettings}
                                    alt=''
                                    className='bio-icons'/>
                                </Col>
                                <Col xs={8}>
                                    <img src={usersIcon}
                                        onClick={this.displayFriends}
                                        alt=''
                                        className='bio-icons' />
                                </Col>
                            </Row>
                            <Row>
                                <Col md={3}></Col>
                                <Col xs={12} md={8}><hr /> </Col>
                                <Col md={1}>

                                </Col>
                            </Row>
                            <Row>
                                <Col xs={12}>
                                    <p className='text-secondary'>{person.description() ? person.description()
                                            : 'You have no bio.'}
                                    </p> 
                                </Col>
                            </Row>
                    </div>
                    
                    </div>

                    {this.state.displayFriends && friendDisplay}
                    {!this.state.displayFriends && <div className='profile-posts'>
                        <Row>
                        <Col xs={1} md={1} xl={2}>
                                
                        </Col>
                        <Col sm={12} md={10} xl={8}>
                        {this.isLocal() &&
                            <div>
                                {this.state.changeInfo && settingsForm }
                            <div className="new-status">
                                <Row>
                                    <Col md={12}>
                                            {
                                                this.state.newImage &&
                                                <div className='post-pic-container'>
                                                    <Button onClick={this.deleteImage} variant="outline-danger" className='delete-img'>X</Button>
                                                    <img alt='' className='post-pic' als='' src={this.state.newImage} />
                                                </div>}
                                            <InputGroup>
                                                <FormControl
                                                    as='textarea'
                                                    className="input-status"
                                                    value={this.state.newStatus}
                                                    name='newStatus'
                                                    onChange={e => this.handleNewStatusChange(e)}
                                                    placeholder="What's on your mind?"
                                                />
                                            </InputGroup>
                                            <InputGroup size="sm" className="mb-3">
                                                <InputGroup.Prepend>
                                                    <InputGroup.Text id="inputGroup-sizing-sm">Tags</InputGroup.Text>
                                                </InputGroup.Prepend>
                                                <FormControl 
                                                aria-label="Small" 
                                                aria-describedby="inputGroup-sizing-sm" 
                                                value={this.state.tags}
                                                name='tags'
                                                onChange={e => this.handleNewStatusChange(e)}
                                                placeholder="Separate tags by space"
                                                />
                                            </InputGroup>
                                    </Col>
                                </Row>
                                
                                <Row>
                                <Col xs={3} className='input-btn-wrapper'>
                                    <label className="btn btn-outline-secondary">
                                        <img alt='' src={cameraIcon} /> <input type="file" onChange={this.captureFile} hidden/>
                                    </label>
                                </Col>
                                <Col xs={5}></Col>
                                <Col xs={4} className=" input-btn-wrapper">
                                            <Button variant="outline-success"
                                        className=""
                                        onClick={e => this.handleNewStatusSubmit(e)}
                                    >
                                        POST
                                    </Button>
                                </Col>
                                </Row>
                            </div>
                            </div>
                        }</Col>
                        <Col xs={1} md={1}></Col>
                        </Row>
                        <Row>
                        <Col xs={1} md={1} xl={2}></Col>
                            <Col sm={12} md={10} xl={8}>
                                <Row className='cur-user-posts-options-bg'>
                                    <Col className='cur-user-posts-option' style={postStyle} onClick={() => {this.handleFilterPosts('posts')}} >posts</Col>
                                    <Col className='cur-user-posts-option' style={commentStyle} onClick={() => {this.handleFilterPosts('comments')}} >comments</Col>
                                    <Col className='cur-user-posts-option' style={replyStyle} onClick={() => {this.handleFilterPosts('replies')}} >replies</Col>
                                    <Col className='cur-user-posts-option' style={likedStyle} onClick={() => { this.handleFilterPosts('liked') }} >liked</Col>
                                </Row>

                                {
                                    this.state.displayPosts ?
                                        <div>{ this.props.curUserOwnPosts.postIDs.length > 0 && this.props.curUserOwnPosts.loaded && !this.state.isLoading && <InfiniteScroll order={this.props.curUserOwnPosts.postIDs} postIdAndName={this.props.curUserOwnPosts.postIDAndName} doneLoading={this.props.curUserOwnPosts.loaded} /> }</div> :
                                        (<div>{(this.state.displayComments || this.state.displayReplies || this.state.displayLiked) && <InfiniteScroll 
                                        order={this.state.commentTimes} 
                                        postIdAndName={this.state.commentIDAndName} 
                                        doneLoading={!this.state.isLoading} 
                                        />}</div>)

                                }
                        </Col>
                        <Col xs={1} md={1}></Col>
                        </Row>
                    </div>}
                </div>}
            </div>

        );
    }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
    currentUserInformation,
    addToCurrentUserPosts
}, dispatch);

const mapStateToProps = (state) => {
    return ({
        curUserInfo: state.curuserInfo,
        curUserOwnPosts: state.curUserOwnPosts
    })
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MyProfile));