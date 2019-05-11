// @flow
import React, { Component } from 'react';
// import { Link } from 'react-router-dom';
import styles from './Home.css';
const { ipcRenderer } = require('electron');
import SettingsIcon from '@material-ui/icons/Settings';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';

{/* <CircularProgress
variant="determinate"
value={100}
className={classes.facebook1}
size={24}
thickness={4}
/> */}

type Props = {};

const timeAlias = {
    "6h" : 21600000,
    // "6h" : 30000,
    "12h" : 43200000,
    "24h" : 86400000,
  }

export default class Home extends Component<Props> {
  props: Props;
  constructor(props) {
    super(props);
    this.intervalTimer = 0;
    this.state = {
      status : 'Ready to begin',
      nextRun : 'In a Moment',
      menu: false,
      runEvery : '6h',
      started : false
    }

    
    ipcRenderer.on('progress', (e, payload) => {
      this.setState({status : payload})
  })

  ipcRenderer.on('done', (e, timeInMS) => {
      console.log('done')
      clearInterval(this.intervalTimer);
      let counter = 0;
      this.intervalTimer = setInterval(() => {
          if(timeInMS - counter * 1000 <= 0) {
              clearInterval(this.intervalTimer);
              return;
          }
          let txt;
          let currTimer = (timeInMS / 1000) - counter;
          if(currTimer > 3600) {
              txt = ((((timeInMS / 1000) - counter)/60)/60).toFixed(0) + ' Hours';
          } else if(currTimer > 600) {
              txt = (((timeInMS / 1000) - counter)/60).toFixed(0) + ' Mins';
          } else {
              txt = (timeInMS / 1000) - counter + ' Secs';
          }
          this.setState({status : 'Queued to ' + txt})

          counter++;
      },1000) ;
  })
  }

  saveUserInfo = (e) => {

    e.preventDefault();
    let email = this.email.value;
    let pass = this.pass.value;
    localStorage.email = email;
    localStorage.pass = pass;
    this.setState({});
  };

  sendFormToElectron = (e,runNow) => {
    console.log('Sumbit')
    e.preventDefault();
    let electronAction = runNow ? 'runNow' : 'authPayload';
    let email,pass;
    
    if(localStorage.pass && localStorage.email) {
      email = localStorage.email;      
      pass = localStorage.pass;      
    } else {
      email = this.email.value;
      pass = this.pass.value;
      localStorage.email = email;
      localStorage.pass = pass;
    }

    let runEvery = this.state.runEvery;
    let timeInMs = timeAlias[runEvery] || 21600000;
    let payload = { email, pass, timeInMs };
    
    clearInterval(this.intervalTimer);
    ipcRenderer.send(electronAction, payload);
    this.setState({started : true});

  };

  handleMenu = (open) => {
    if(open) {
      this.setState({menu : open.currentTarget})
    } else {
      this.setState({menu : open})
    }
    
  };

  handleSelectChange = (e) => {
    this.setState({runEvery:e.target.value})
  };
  
  handleStop = () => {
    clearInterval(this.intervalTimer);
    this.setState({started : false})
    ipcRenderer.send('stop');

  };

  logOut = () => {
    localStorage.clear();
    ipcRenderer.send('clearUserData');
    this.setState({})

  }

  render() {
    let hasUserInfo = localStorage.email && localStorage.pass;
    let {menu} = this.state;

    let loginInfo =   <div className={styles.savedInfo}>
    <div className={styles.savedInfoSectionHeader}>Saved Information:</div>
    <div className={styles.savedInfoSection}>Email: {localStorage.email}</div>
    <div className={styles.savedInfoSection}>Pass: {localStorage.pass}</div>
  </div> ;
    return (
      <div className={styles.container} data-tid="container">
        <div className={styles.header} >
          <div className={styles.title}>Yad2 Bouncer</div>
          {localStorage.email ? 
          <div className={styles.usernameWrapper}>
            <div className={styles.username}>Hello {localStorage.email.split('@')[0]}</div>
            
            <SettingsIcon 
               aria-owns={menu ? 'simple-menu' : undefined}
               aria-haspopup="true" 
               onClick={(e) => {this.handleMenu(e)}}
               className={styles.settingsIcon} />
            <Menu
              id="simple-menu"
              anchorEl={menu}
              open={!!menu}
              onClose={() => {this.handleMenu(false)}}
            >
              <MenuItem onClick={() => {
                this.logOut()
                this.handleMenu(false)
                }}>Logout</MenuItem>
            </Menu>
              </div> : ''}
        </div> 
        <div className={styles.progress}>
            <div className={styles.status}> Status : {this.state.status}</div>
            {/* <div className={styles.nextRunWrapper}>
              <div className={styles.nextRun}>Next run</div>
              <div ref={this.nextRun} className={styles.nextRunTxt}>{this.state.nextRun}</div>
            </div> */}
        </div>
        
          {hasUserInfo ? null : 
          <div className={styles.form}>
              <div className={styles.formTitle}>Please enter your login information</div>
              <form onSubmit={(e) => {this.saveUserInfo(e)}}>
              <div className={styles.textField}>
                <TextField
                  id="standard-name"
                  label="Email"
                  inputRef={el => this.email = el} 
                  style = {{width: '100%'}}
                />
              </div>
              <div className={styles.textField}>
                <TextField
                  id="standard-name"
                  label="Password"
                  type="password"
                  inputRef={el => this.pass = el} 
                  style = {{width: '100%'}}
                />  
              </div>
              <Button type="submit" variant="contained" className={styles.saveBtn}>Save</Button>
            </form> 
          </div>
          
        }
          
         
        {hasUserInfo && <div className={styles.runEveryWrapper}>
          <div className={styles.runEveryTxt}>Run Every </div>
          <FormControl className={styles.formControl}>
            <Select
              value="6h"
              name=""
              value={this.state.runEvery}
              onChange={this.handleSelectChange}
              // displayEmpty
              className={styles.selectEmpty}
            >
              <MenuItem value="6h">6 Hours</MenuItem>
              <MenuItem value="12h">12 Hours</MenuItem>
              <MenuItem value="24h">24 Hours</MenuItem>
            </Select>
          </FormControl>
        </div>}
        <div className={styles.btnsWrapper}>
        {this.state.started ? 
        <Button color={"secondary"} 
          variant="contained" 
          className={styles.startBtn} 
          style={!hasUserInfo ? {display : 'none'} : null}
          onClick={() => {this.handleStop()}}>
          Stop
        </Button>
        :
        <Button color={"primary"} 
                variant="contained" className={styles.startBtn} 
                style={!hasUserInfo ? {display : 'none'} : null}
                onClick={(e) => {this.sendFormToElectron(e)}}>
                Start
        </Button>}
        {hasUserInfo && <Button
                variant="contained" className={styles.startBtn} 
                style={!hasUserInfo ? {display : 'none'} : null}
                onClick={(e) => {this.sendFormToElectron(e,true)}}>
                Run now
        </Button>}
        </div>
    </div>
    );
  }
}
