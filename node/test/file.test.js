const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

describe('Admin Add Data Upload (Invalid File)', () => {
  const agent = chai.request.agent(app);
  const testFilePath = path.join(__dirname, 'test.txt');
  const testFilePath2 = path.join(__dirname, 'bad-data.csv');


  before((done) => {
    agent
      .post('/login')
      .send({ username: 'dataflow', password: '123' })
      .end((err, res) => {
        expect([200, 302]).to.include(res.status);
        done();
      });
  });

  it('should fail to upload a .txt file and return an error response', (done) => {
    agent
      .post('/admin/add-data')
      .set('Content-Type', 'multipart/form-data')
      .attach('csvFile', fs.readFileSync(testFilePath), 'test.txt')
      .end((err, res) => {
        expect(res).to.have.status(500); 
        expect(res.text).to.include('Error adding data');
        done();
      });
  });

    it('should fail to upload a .csv file and return an error response', (done) => {
    agent
      .post('/admin/add-data')
      .set('Content-Type', 'multipart/form-data')
      .attach('csvFile', fs.readFileSync(testFilePath2), 'bad-data.csv')
      .end((err, res) => {
        expect(res).to.have.status(500);
        expect(res.text).to.include('Error adding data');
        done();
      });
  });

  after(() => {
    agent.close(); // Clean up
  });
});
