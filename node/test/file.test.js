const chai = require('chai');
const chaiHttp = require('chai-http');
const fs = require('fs');
const path = require('path');
const app = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

describe('Admin Add Data Upload (Invalid File) and Data Removal', () => {
  const agent = chai.request.agent(app);
  const testFilePath = path.join(__dirname, 'test.txt');
  const testFilePath2 = path.join(__dirname, 'bad-data.csv');
  const testFilePath3 = path.join(__dirname, 'test-data.csv');

  before((done) => {
    agent
      .post('/login')
      .send({ username: 'dataflow', password: '123' })
      .end((err, res) => {
        expect([200, 302]).to.include(res.status);
        done();
      });
  });

  it('should fail to upload a .txt file and return a 400 error', (done) => {
    agent
      .post('/admin/add-data')
      .set('Content-Type', 'multipart/form-data')
      .attach('csvFile', fs.readFileSync(testFilePath), 'test.txt')
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.include('Invalid file type. Please upload a CSV file.');
        done();
      });
  });

  it('should fail to upload a malformed .csv file and return a 400 or 500 error', (done) => {
    agent
      .post('/admin/add-data')
      .set('Content-Type', 'multipart/form-data')
      .attach('csvFile', fs.readFileSync(testFilePath2), 'bad-data.csv')
      .end((err, res) => {
        expect([400, 500]).to.include(res.status);
        expect(res.text).to.include('Error adding data. Please check your CSV file and try again.');
        done();
      });
  });

  it('should pass to upload a correct .csv file', (done) => {
    agent
      .post('/admin/add-data')
      .set('Content-Type', 'multipart/form-data')
      .attach('csvFile', fs.readFileSync(testFilePath3), 'test-data.csv')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Data uploaded successfully!');
        done();
      });
  });


  it('should remove data by referenceNumber and return success message', (done) => {
    const referenceNumber = 'df23d99e-6ddb-4668-ae8b-611084c8c500';

    agent
      .post('/admin/remove-data')
      .send({ referenceNumber })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include(`Deleted river entry with ID: ${referenceNumber}`);
        done();
      });
  });

  it('should remove data by removeDatePeriod and return success message', (done) => {
    const removeDatePeriod = '2025-01-01';

    agent
      .post('/admin/remove-data')
      .send({ removeDatePeriod })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include(`Deleted river entries with date: ${removeDatePeriod}`);
        done();
      });
  });

  it('should return 400 error when no referenceNumber or date provided', (done) => {
    agent
      .post('/admin/remove-data')
      .send({})
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.text).to.include('Please provide a reference number or date to delete.');
        done();
      });
  });

  after(() => {
    agent.close();
  });
});
