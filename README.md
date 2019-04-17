# My Block Space
This is a social networking app built with Blockstack.
It will be a uncensored social network, build by the ![NYC Blockchain Devs](https://www.meetup.com/nyc-blockchain-devs) and ![me](https://github.com/chancelorb).

## Try Demo DApp on your Ganache Test Network

The Demo app is currently only working together with the ![my block space server](https://github.com/chancelorb/my-block-space-server). 


## Run Demo DApp

### 1. Check node version

Make sure you have `node` installed and it's version 8.5.0 or greater

```
node --version
```
### 2. Start your mongodb server 
If you have mongodb installed:
```
mongo

```
If you don't have mongodb and use brew:
```
brew tap mongodb/brew
brew install mongodb-community@4.0
mongod --config /usr/local/etc/mongod.conf
brew services start mongodb-community@4.0
mongo
```
For more info about installing mongodb checkout the ![mongodb docs](https://docs.mongodb.com/manual/installation/)

### 3. Set up Radiks Server

- ![my block space server](https://github.com/chancelorb/my-block-space-server)

In a new tab:
```
git clone https://github.com/chancelorb/my-block-space-server my-block-space-server && cd my-block-space-server
npm install
npm run start
```

### 4. Set up App 

In a new tab:
```
git clone https://github.com/chancelorb/my-block-space my-block-space && cd my-block-space
npm install
npm run start
```

A browser will open to http://localhost:3000. If you don't have the MetaMask extension (or another wallet provider) follow instructions of the next step.



### 5. Try it!
Create posts, make friends, search for tags and be Awesome!

# Roadmap

*Coming soon.*

<!-- ## Alpha Release -->

<!-- * [ ] Users can submit content URLs into the system. -->

## Future...

