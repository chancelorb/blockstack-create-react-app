import React, {Component} from 'react';
import { Row, Col, Dropdown, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Options from '../assets/options.svg';
import PostEngagement from './PostEngagement';
import { loadUserData, putFile } from 'blockstack';
import Tag from '../model/tag';
import PostModel from '../model/post';
import Linkify from 'linkifyjs/react';
const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';

class Post extends Component {
    constructor(props) {
        super(props);
        this.state = {
            now: Date.now(),
            fullText: false,
            toggleOptions: false,
            deleted: false,
            isLocal: false,
            tags: [],
        }
    }

    parseDate = (time) => {
        const { now } = this.state;
        if (Math.floor((now - time) / (1000 * 60)) < 60) {
            if (Math.floor((now - time) / (1000 * 60)) < 1) {
                return `${Math.floor((now - time) / 1000)} s`
            } else {
                return `${Math.floor((now - time) / (1000 * 60))} m`
            }
        } else if (Math.floor((now - time) / (1000 * 60 * 60)) < 24) {
            return `${Math.floor((now - time) / (1000 * 60 * 60))} h`
        } else if (Math.floor((now - time) / (1000 * 60 * 60 * 24)) < 7) {
            return `${Math.floor((now - time) / (1000 * 60 * 60 * 24))} d`
        } else if (Math.floor((now - time) / (1000 * 60 * 60 * 24)) < 365) {
            return `${Math.floor(Math.floor((now - time) / (1000 * 60 * 60 * 24)) / 7)} w`
        }
    }
    showFulltext = () => {
        this.setState({ fullText: !this.state.fullText})
    }
    isLocal = () => {
        this.setState({isLocal: this.props.status.username === loadUserData().username ? true : false});
    }
    toggleOptions = () => {
        this.setState({toggleOptions: !this.state.toggleOptions})
    }
    handleDelete = () => {
        this.setState({deleted: !this.state.deleted});
    }
    deletePost = async () => {
        //TODO: fix delete to work with radiks
        const optionsSend = { encrypt: false }
        await putFile(`post${this.props.radiksId}.json`, '', optionsSend);
        try {
            console.log(this.props.radiksId)
            const post = await PostModel.findById(this.props.radiksId)
            post.update({
                _id: '0',
                username: ''
            })
            console.log({post})
            post.save()
            this.handleDelete();
        } catch (e) {
            console.log(`We had a problem deleting the post. message: ${e}`)
        }
    }

    loadTags = async () => {
        const tags = await Tag.fetchList({ post_id: this.props.radiksId }, { decrypt: true });
        if (tags.length > 0) {
            return this.setState({ tags })
        } 
    }

    componentDidMount() {
        this.isLocal();
        this.loadTags()
    }
    

    render() {
        const {status} = this.props;
        return (<div>
            {!this.state.deleted && <div className="my-post" >
                <Row className='poster-info-con'>
                    <Col xs={2}>
                        <Link className='post-link' to={`/users/${status.username}`}><img
                            src={status.imageUrl ? status.imageUrl : avatarFallbackImage}
                            alt=''
                            className="post-img"
                        /></Link>
                    </Col>
                    <Col xs={8} className='poster-info'>
                        <Link className='post-link' to={`/users/${status.username}`}>{status.fullName ? status.fullName : status.username}</Link>
                        <span className='post-date'>&nbsp;· {`${this.parseDate(status.created_at)} ago`}</span>
                    </Col>
                    <Col xs={2}>
                    {this.state.isLocal && <Col xs={{ span: 3, offset: 4 }}>
                        <img className='post-icon' onClick={this.toggleOptions} src={Options} alt='options' />
                        {this.state.toggleOptions && <Dropdown.Menu show>
                            <Dropdown.Item onClick={this.deletePost}>Delete post</Dropdown.Item>
                        </Dropdown.Menu>}
                    </Col>}
                    </Col>
                    <Col xs={0}></Col>
                </Row>
                
                { status.image &&
                    <div className='post-pic-container'>
                        <img alt='' className='post-pic' src={status.image} />
                        <hr />
                    </div>
                }
                {!this.state.fullText && (status.text.length > 500 || status.text.split(/\r\n|\r|\n/).length > 5 ? (<Linkify tagName="pre" options={{}}>{status.text.substring(0, 500).split(/\r\n|\r|\n/).slice(0, 6).join('\n')}...<br /><strong className='show-more' onClick={this.showFulltext}>show more</strong></Linkify>) : <Linkify tagName="pre" options={{}}>{status.text}</Linkify>)}

                {this.state.fullText && <Linkify tagName="pre" options={{}}>{status.text} <br /><strong className='show-more' onClick={this.showFulltext}>show less</strong></Linkify>}
                <div className="tag-con">
                    {this.state.tags.length > 0 && this.state.tags.map(tag => {
                        return <Link className='post-link' key={tag._id} to={`/tags/${tag.attrs.tag}`}><Badge pill variant="secondary" key={tag.attrs.tag}>{tag.attrs.tag}</Badge>{"  "}</Link>
                    })}
                </div>
                <PostEngagement status={status} openComments={this.handleOpenComments} radiksId={this.props.radiksId} reload={this.props.reload}/>
            </div>}</div>
        )
    }
}

export default Post;