const schema = require('../schema/claim')
const userService = require('../services/user-service')
const claimService = require('../services/claim-service')

module.exports = {
  method: 'POST',
  path: '/claim',
  options: {
    validate: { payload: schema,
      failAction: async (request, h, error) => {
        console.log(`rejected payload ${payload}`)
        return h.response().code(400)
      }
    },
    handler: async (request, h) => {
      console.log('new claim received')

      let userSuccess = await userService.register({email:request.payload.email})
      let claimSuccess = await claimService.submit({
        claimId: request.payload.claimId,
        properyType: request.payload.properyType,
        accessible: request.payload.accessible,
        dateOfSubsidence: request.payload.dateOfSubsidence,
        mineType: request.payload.mineType
      })

      if(!userService || ! claimSuccess){
        return h.response().code(503)  
      }
      return h.response().code(200)
    }
  }
}
