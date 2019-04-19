import React, { Component } from 'react';
import { Navbar, Nav, InputGroup, FormControl, Button, Dropdown } from 'react-bootstrap';
import {signUserOut} from 'blockstack';
import { Link } from 'react-router-dom';
import logo from '../assets/3.png';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';




class Navigationbar extends Component {
    constructor() {
        super()
        this.state = {
            searchUser: undefined,
            foundUsers: []
        }
    }

    handleSignOut = (event) => {
        event.preventDefault();
        signUserOut(window.location.origin)
    }
    
    handleKeyPress = (e) => {
        e.preventDefault();
        if (this.state.searchUser) {
            const user = this.state.searchUser.trim();
            this.props.searchFor(user);
            this.setState({ foundUsers: [], searchUser: undefined })
        }
    }
    handleSearchTag = (e) => {
        e.preventDefault();
        if(this.state.searchUser) {
            const tag = this.state.searchUser.trim();
            this.props.searchTag(tag)
            this.setState({ foundUsers: [], searchUser: undefined })
        }
    }
    fetchPerson = async () => {
        let url = `https://core.blockstack.org/v1/search?query=${this.state.searchUser}`;
        let resp = await fetch(url)

        if (resp.statusCode >= 400) {
            console.warn(`error status from ${url}: ${resp.statusCode}`)
            this.setState({foundUsers: []})
        }

        try {
            const { results } = await resp.json()
            this.setState({ foundUsers: results })
            console.log(results)
        } catch (e) {
            console.warn(`bad JSON from ${url}`)
            this.setState({foundUsers: []})
        }
    }
    searchBySugested = (name) => {
        this.setState({ foundUsers: [], searchUser: undefined })
        this.props.searchFor(name)
    }

    handleChange = (event) => {
        event.preventDefault();
        this.setState({
            searchUser: event.target.value
        })
        if (event.target.value) {
            this.fetchPerson()
        } else {
            this.setState({ foundUsers: [], searchUser: undefined })
        };
    }


    render() {
        
        const { person, username } = this.props.curUserInfo;
        
        return (
            <div>
                <Navbar bg="light" collapseOnSelect fixed="top" expand="sm" className='navbar-con'>
                        <Navbar.Brand >
                        <Link className='nav-home-link' to='/feed'>
                            <img
                                src={logo}
                                width="30"
                                height="30"
                                className="d-inline-block align-top logo-nav"
                                alt="MY BLOCK SPACE"
                            />
                        </Link>
                        </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className='mr-auto'>
                            <InputGroup size="sm">
                                <FormControl
                                    type="text"
                                    placeholder="Search for"
                                    onChange={e => this.handleChange(e)}
                                />
                                <InputGroup.Append>
                                    <Button variant="outline-secondary" onClick={e => this.handleKeyPress(e)} >friends</Button>
                                </InputGroup.Append>
                                <InputGroup.Append>
                                    <Button variant="outline-secondary" onClick={e => this.handleSearchTag(e)} >tags</Button>
                                </InputGroup.Append>
                            </InputGroup>
                            {this.state.searchUser && <Dropdown.Menu className='user-drop-down' show>
                                {this.state.foundUsers.map((result, index) => { return <Dropdown.Item eventKey={index} active={false} onClick={() => { this.searchBySugested(result.fullyQualifiedName) }}>{result.fullyQualifiedName}</Dropdown.Item> })}
                            </Dropdown.Menu>}
                        </Nav>
                        <Nav className='justify-content-end"'>
                            <Nav.Link onClick={this.handleSignOut}>
                                Sign-Out
                            </Nav.Link>
                            <Link to={`/${username ? username : null}`}>
                            <img
                                    src={person.avatarUrl() ? person.avatarUrl() : avatarFallbackImage}
                                alt=''
                                className="nav-img"
                            />
                            </Link>
                        </Nav>
                    </Navbar.Collapse>
                </Navbar>
            </div>
        )
    }
}


const mapDispatchToProps = (dispatch) => bindActionCreators({
    
}, dispatch);

const mapStateToProps = (state) => {
    return ({
        curUserInfo: state.curuserInfo
    })
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Navigationbar));