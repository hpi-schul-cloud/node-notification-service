'use strict';

const assert = require('assert');
const app = require('../../../src/app');

const TestUtil = require('../../testUtil');

describe('notification service', function() {
  it('registered the notifications service', () => {
    assert.ok(app.service('notifications'));
  });

  it('get with valid token', () => {
    return TestUtil.createNotification('firstUser')
      .then((notification) => {
        return app.service('notifications').get(notification._id, {
          query: {
            'token': 'student1_1',
          }
        }).then(res => {
          // TODO return HTTP code
          assert.ok(res);
        })
      });
  });

  it('get() rejects invalid token', () => {
    return TestUtil.createNotification('firstUser')
      .then((notification) => {
        return app.service('notifications').get(notification._id, {
          query: {
            'token': 'student999',
          }
        }).catch(res => {
          assert.equal(res.code,401);
        })
      });
  });

  it('get() rejects missing token', () => {
    return TestUtil.createNotification('firstUser')
      .then((notification) => {
        return app.service('notifications').get(notification._id, {}).catch(res => {
          assert.equal(res.code,400);
        })
      });
  });

  it('find() with valid token', () => {
    return TestUtil.createNotification('firstUser')
      .then((notification) => {
        return app.service('notifications').find({
          query: {
            'token': 'student1_1',
          }
        }).then(res => {
          // TODO return HTTP Code
          assert.ok(res);
        })
      });
  });

  it('find() rejects missing token', () => {
    return TestUtil.createNotification('firstUser')
      .then((notification) => {
        return app.service('notifications').find({}).catch(res => {
          assert.equal(res.code,400);
        })
      });
  });

  it('find() rejects invalid token', () => {
    return TestUtil.createNotification('firstUser')
      .then((notification) => {
        return app.service('notifications').find({
          query: {
            'token': 'student999',
          }
        }).catch(res => {
          assert.equal(res.code,401);
        })
      });
  });

});
