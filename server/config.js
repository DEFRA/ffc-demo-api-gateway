const Joi = require('@hapi/joi')

// Define config schema
const schema = Joi.object({
  port: Joi.number().default(3001),
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  userService: Joi.string().uri().default('http://localhost:3002'),
  claimService: Joi.string().uri().default('http://localhost:3003'),
  restClientTimeoutMillis: Joi.number().default(5000)
})

// Build config
const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  userService: process.env.FFC_DEMO_USER_SERVICE,
  claimService: process.env.FFC_DEMO_CLAIM_SERVICE,
  restClientTimeoutMillis: process.env.FFC_DEMO_REST_CLIENT_TIMEOUT_IN_MILLIS
}

// Validate config
const result = schema.validate(config, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the Joi validated value
const value = result.value

// Add some helper props
value.isDev = value.env === 'development'
value.isProd = value.env === 'production'

module.exports = value
