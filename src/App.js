import React, { Component } from 'react';
import MyProfile from './components/MyProfile';
import Signin from './components/Signin';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import Feed from './components/Feed';
import {
  isSignInPending,
  isUserSignedIn,
  handlePendingSignIn,
  loadUserData,
  Person
} from 'blockstack';
import { Switch, Route, withRouter } from 'react-router-dom'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { currentUserInformation } from './actions';
//I separated this bc the below imports are added for the radiks server
import { User } from 'radiks'
import VriendUser from './model/vriendUser'
import FollowInfo from './model/followInfo';
import SinglePost from './components/SinglePost';
import TagPage from './components/TagPage';
import './App.scss';



class App extends Component {

  constructor(props) {
    super(props)
    let isSignedIn = isUserSignedIn();
    let isPending = isSignInPending();
    this.state = {
      isSignedIn,
      isPending
    }

    if (isSignedIn) {
      this.props.currentUserInformation();
      this.loadRadiksStuff(loadUserData());
    }
    if (isPending) {
      handlePendingSignIn().then(async(userData) => {
        if (userData) {
          this.props.currentUserInformation();
          this.loadRadiksStuff(userData);
          this.setState({isSignedIn: true})
        }
      })
    }
  }

  // function checks if user has vriend account.
  // then calls function to load account info or creates account
  loadRadiksStuff = async(userData) => {
    await User.createWithCurrentUser()
    const curUserHasAccount = await VriendUser.findOne({ username: userData.username, }, { decrypt: true })
    if (!curUserHasAccount) {
      const person = await new Person(userData.profile)
      const username = userData.username
      const newUser = new VriendUser({
        description: person.description(),
        username,
        image_url: person.avatarUrl(),
        display_name: person.name(),
      })
      const followInfo = await new FollowInfo({
        username,
      })
      await newUser.save()
      await followInfo.save()
      return console.log({newUser, followInfo})
    } else {
      const curUserFollowInfo = await FollowInfo.findOne({ username: userData.username, }, { decrypt: true })
      return console.log({info: {curUserHasAccount, curUserFollowInfo}})
    }
    
  }
  
  componentDidMount = async () => {
      
  }

  //search by blockstack id, by pushing blockstack id in url, route users handles search
  searchFor = (name) => {
    this.props.history.push(`/users/${name}`)
  }
  searchTag = (tag) => {
    this.props.history.push(`/tags/${tag}`)
  }

  render() {
    const {loaded} = this.props.curUserInfo;

    return (
      <div className="App">
        {!this.state.isSignedIn ?
          <Signin handleSignIn={this.handleSignIn} />
          :
          (<div><Navbar
            searchFor={this.searchFor}
            searchTag={this.searchTag}
           />
          <Switch>
            <Route
              path='/users/:username'
              render={
                props => <Profile {...props} />
              }
            />
            <Route
              path='/post/:username/:postId'
              render={
                props => <SinglePost {...props} />
              }
            />
            <Route
              path='/tags/:tagName'
              render={
                props => <TagPage {...props} />
              }
            />
            {loaded && <Route
            exact path='/feed'
            render={
              props => <Feed
                searchFor={this.searchFor}
                {...props} />
            }
            />}
            <Route
              path='/:username'
              render={
                props => <MyProfile
                  searchFor={this.searchFor}
                  {...props} />
              }
            />
              {loaded && <Route
              exact path='/'
              render={
                props => <Feed
                  searchFor={this.searchFor}
                  {...props} />
              }
            />}
            
          </Switch></div>)
        }
      </div>
    );
  }
}

const mapDispatchToProps = (dispatch) => bindActionCreators({
  currentUserInformation
}, dispatch);

const mapStateToProps = (state, ownProps) => {
  return ({
    history: ownProps.history,
    curUserInfo: state.curuserInfo
  })
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
