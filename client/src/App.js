import React, { useState, useEffect } from 'react';
import { uuid } from 'uuidv4';

import socketIOClient from 'socket.io-client';

const ENDPOINT = 'http://localhost:1234';
// let timer;

// class App extends React.Component {
//   constructor(props) {
//     super(props);
    
//     this.state = {
//       task: {},
//       id: '',
//       counter: 10,
//       percent: 100,
//     }
//     this.socket = socketIOClient(ENDPOINT);
//   }

//   componentDidMount() {
//     const id = uuid();
//     this.socket.on('connect', () => {
//       this.socket.emit('USER_CONNECTION', { id, socketId: this.socket.id, status: 'ready' });
//     })

//     this.socket.on('TASK_ASSIGNMENT', (data) => {
//       this.setState({
//         task: data,
//       });
//       this.countDown();
//     });
//     window.addEventListener('beforeunload', this.handleUnload);
//   }


//   componentWillUnmount() {
//     window.removeEventListener('beforeunload', this.handleUnload);
//     clearInterval(timer);
//     this.socket.disconnect(true);
//   }

//   handleUnload = (e) => {
//     console.log('TTTTTTTTTTT');
//     const { task } = this.state;
//     if (task.id) {
//       let result = {};
//       result = {
//         status: 'faile',
//         ...task,
//         count: task.count ? task.count + 1 : 1,
//       };
//       this.socket.emit('USER_CLOSE_TAB', {
//         socketId: this.socket.id,
//         status: 'ready'
//       }, result);
//     }
//   }

//   countDown =   () => {
//     if (this.state.counter > 0) {
//       timer = setInterval(() => {
//         this.setState({
//           counter: this.state.counter - 1,
//           percent: this.state.percent - Math.ceil(this.state.percent / this.state.counter),
//         });
//       }, 1000);
//     }
//   }

//   handleExpired = () => {
//     clearInterval(timer);
//     const { task } = this.state;
//     if (task.id) {
//       let result = {};
//       result = {
//         status: 'timeout',
//         ...task,
//         count: task.count ? task.count + 1 : 1,
//       };
//       this.setState({ counter: 10, percent: 100, task: {} });
//       this.socket.emit('TASK_HANDLER', {
//         socketId: this.socket.id,
//         status: 'ready',
//       }, result);
//     }
//   }


//   // handle task assigned
//   handleSubmit = (e) => {
//     const { task } = this.state;
//     if (task.id) {
//       let result = {};
//       result = {
//         ...task,
//         status: 'done',
//       };
//       this.setState({ counter: 10, percent: 100, task: {} }, () => {
//         clearInterval(timer);
//         this.socket.emit('TASK_HANDLER', {
//           socketId: this.socket.id,
//           status: 'ready',
//         }, result);
//       });
//     }
//   }

//   render() {
//     console.log(this.state.counter);
//     if (this.state.counter < 0) {
//       console.log('----352463463----');
//       this.handleExpired();
//     }
//     return (
//       <div className="App" style={{ marginTop: '30px', marginLeft: '30px' }}>
//         <div>
//           <p>Countdown: {this.state?.counter}</p>
//           <p>ID: {this.state?.task?.id}</p>
//           <p> Data: {this.state.task.text}</p>
//           <p>Retry: {this.state?.task?.count ? this.state?.task?.count : 0}</p>
//           {/* <input name="input" style={{ marginRight:'20px' }} onChange={this.handleChange} /> */}
//           <button onClick={this.handleSubmit}>Submit</button>
//         </div>
//      </div>
//     )
//   }
// }


// export default App;


/* eslint-disable no-confusing-arrow */
/* eslint-disable max-len */
/* eslint-disable react/no-string-refs */
// import React from 'react';
// import _ from 'lodash';
// import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
// import { Button, Col, Row, Form, Progress, Tag, Carousel } from 'antd';
// import socketIOClient from 'socket.io-client';
// import { getAccessToken, getAccountId } from '../../utils/authority';
// import PageHeaderLayout from '../../layouts/PageHeaderLayout';
// import { SOCKET_ENDPOINT } from '../../common/constants';

let timer;

class RequestQueue extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      task: {},
      id: '',
      counter: 10,
      percent: 100,
      imageVisible: false,
    };
    this.socket = socketIOClient(ENDPOINT,);
  }

  componentDidMount() {
    const id = uuid();
    this.socket.on('connect', () => {
      this.socket.emit('USER_CONNECTION', { id, socketId: this.socket.id, status: 'ready' });
    });

    this.socket.on('TASK_ASSIGNMENT', (data) => {
      this.setState({
        task: data,
        imageVisible: true,
      }, () => {
        // start countdown when has assigned task
        this.countDown();
      });
    });
    window.addEventListener('beforeunload', this.handleUnload);
  }

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleUnload);
    clearInterval(timer);
    this.socket.disconnect(true);
  }

  handleUnload = () => {
    const { task } = this.state;
    if (task.id) {
      let result = {};
      result = {
        status: 'faile',
        ...task,
        count: task.count ? task.count + 1 : 1,
      };
      this.socket.emit('USER_CLOSE_TAB', {
        socketId: this.socket.id,
        status: 'ready',
      }, result);
    }
  }

  countDown = () => {
    if (this.state.counter > 0) {
      timer = setInterval(() => {
        this.setState({
          counter: this.state.counter - 1,
          percent: this.state.percent - Math.ceil(this.state.percent / this.state.counter),
        });
      }, 1000);
    }
  }

  handleExpired = () => {
    clearInterval(timer);
    const { task } = this.state;
    if (task.id) {
      let result = {};
      result = {
        status: 'timeout',
        ...task,
        count: task.count ? task.count + 1 : 1,
      };
      this.setState({ counter: 10, percent: 100, task: {}, imageVisible: false }, () => {
        console.log('dadksfkskfksfkk');
        this.socket.emit('TASK_HANDLER', {
          socketId: this.socket.id,
          status: 'ready',
        }, result);
      });
    }
  }

  handleApprove = () => {
    const { task } = this.state;
    if (task.id) {
      let result = {};
      result = {
        ...task,
        status: 'done',
      };
      this.setState({ counter: 10, percent: 100, task: {}, imageVisible: false }, () => {
        clearInterval(timer);
        this.socket.emit('TASK_HANDLER', {
          socketId: this.socket.id,
          status: 'ready',
        }, result);
      });
    }
  }

  handleReject = () => {
    const { task } = this.state;
    if (task.id) {
      let result = {};
      result = {
        ...task,
        status: 'failed',
      };
      this.setState({ counter: 10, percent: 100, task: {}, imageVisible: false }, () => {
        clearInterval(timer);
        this.socket.emit('TASK_HANDLER', {
          socketId: this.socket.id,
          status: 'ready',
        }, result);
      });
    }
  }

  render() {
    if (this.state.counter === 0) {
      this.handleExpired();
    }
    return (
      <>
        <div className="App" style={{ marginTop: '30px', marginLeft: '30px' }}>
          <div>
            <p>Countdown: {this.state?.counter}</p>
            <p>ID: {this.state?.task?.id}</p>
            <p> Data: {this.state.task.text}</p>
            <p>Retry: {this.state?.task?.count ? this.state?.task?.count : 0}</p>
            {/* <input name="input" style={{ marginRight:'20px' }} onChange={this.handleChange} /> */}
            <button onClick={this.handleApprove}>Submit</button>
          </div>
      </div>
      </>
    );
  }
}
export default RequestQueue;
