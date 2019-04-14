const Lab = require('lab')
const Code = require('code')
const lab = exports.lab = Lab.script()
const createServer = require('../server')
const sinon = require('sinon')
const userService = require('../server/services/user-service')
const claimService = require('../server/services/claim-service')

lab.experiment('API test', () => {
  let server
  let sandbox

  async function returnTrue (obj) {
    return true
  }

  async function returnFalse (obj) {
    return false
  }

  // Create server before each test
  lab.before(async () => {
    server = await createServer()
    sandbox = sinon.createSandbox()
  })

  lab.afterEach(async () => {
    sandbox.restore()
  })

  lab.test('POST /claim route works', async () => {
    const options = {
      method: 'POST',
      url: '/claim',
      payload: {
        claimId: 'MINE123',
        propertyType: 'business',
        accessible: false,
        dateOfSubsidence: new Date(2015, 5, 6),
        mineType: ['gold', 'iron'],
        email: 'test@email.com'
      }
    }

    sandbox.stub(userService, 'register').callsFake(returnTrue)
    sandbox.stub(claimService, 'submit').callsFake(returnTrue)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(200)
  })

  lab.test('POST /claim route returns 503 if user service unavailable', async () => {
    const options = {
      method: 'POST',
      url: '/claim',
      payload: {
        claimId: 'MINE123',
        propertyType: 'business',
        accessible: false,
        dateOfSubsidence: new Date(2015, 5, 6),
        mineType: ['gold', 'iron'],
        email: 'test@email.com'
      }
    }

    sandbox.stub(userService, 'register').callsFake(returnFalse)
    sandbox.stub(claimService, 'submit').callsFake(returnTrue)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(503)
  })

  lab.test('POST /claim route returns 503 if claim service unavailable', async () => {
    const options = {
      method: 'POST',
      url: '/claim',
      payload: {
        claimId: 'MINE123',
        propertyType: 'business',
        accessible: false,
        dateOfSubsidence: new Date(2015, 5, 6),
        mineType: ['gold', 'iron'],
        email: 'test@email.com'
      }
    }

    sandbox.stub(userService, 'register').callsFake(returnTrue)
    sandbox.stub(claimService, 'submit').callsFake(returnFalse)

    const response = await server.inject(options)
    Code.expect(response.statusCode).to.equal(503)
  })
})
