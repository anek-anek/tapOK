
const { Module } = require('@nestjs/common');
const { ThrottlerModule } = require('@nestjs/throttler');
const throttle = { THROTTLE_DEFAULT: { ttl: 60000, limit: 60 }, THROTTLE_STRICT: { ttl: 60000, limit: 20 } };

class TestModule {}
Module({
  imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 60 }, { name: 'strict', ttl: 60000, limit: 20 }])],
})(TestModule);
module.exports = { TestModule };
