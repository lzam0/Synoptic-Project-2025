const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

describe('Login Route', () => {
  it('should return 200 redirect for valid credentials', (done) => {
    chai.request(app)
    .post('/login')
    .send({ username: 'dataflow', password: '123' })
    .end((err, res) => {
      expect([200, 302]).to.include(res.status);
      done();
    });
});

  it('should return 401 and render login page with error message for invalid credentials', (done) => {
    chai.request(app)
      .post('/login')
      .send({ username: 'dataflow', password: 'wrongpassword' })
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.text).to.include('Username or password is incorrect'); // Check Error message
        done();
      });
  });
});
