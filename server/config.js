const joi = require('@hapi/joi')

// Define config schema
const schema = {
  port: joi.number().default(3001),
  env: joi.string().valid('development', 'test', 'production').default('development'),
  userService: joi.string().uri().default('http://localhost:3002'),
  claimService: joi.string().uri().default('http://localhost:3003'),
  restClientTimeoutMillis: joi.number().default(5000)
}

// Build config
const config = {
  port: process.env.PORT,
  env: process.env.NODE_ENV,
  userService: process.env.FFC_DEMO_USER_SERVICE,
  claimService: process.env.FFC_DEMO_CLAIM_SERVICE,
  restClientTimeoutMillis: process.env.FFC_DEMO_REST_CLIENT_TIMEOUT_IN_MILLIS
}

// Validate config
const result = joi.validate(config, schema, {
  abortEarly: false
})

// Throw if config is invalid
if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

// Use the joi validated value
const value = result.value

// Add some helper props
value.isDev = value.env === 'development'
value.isProd = value.env === 'production'

module.exports = value
