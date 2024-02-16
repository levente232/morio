import containerCreateBody from './bodies/container-create.mjs'

/* eslint-disable no-undef */
export const tests = async ({ chai, expect, config, store }) => {
  describe(`[CORE] Docker test container setup`, () => {
    /*
     * First we need a container to run tests on, so let's start by creating one
     */
    it(`Should create a test container`, (done) => {
      chai
        .request(config.api)
        .post(`/docker/container`)
        .send(containerCreateBody)
        .end((err, res) => {
          expect(res.status).to.equal(201)
          expect(res.type).to.equal('application/json')
          expect(res.charset).to.equal('utf-8')
          expect(typeof res.body.id).to.equal('string')
          store.container = res.body
          done()
        })
    })

    /*
     * Start our test container
     */
    it(`Should start the test container`, (done) => {
      chai
        .request(config.api)
        .put(`/docker/containers/${store.container.id}/start`)
        .end((err, res) => {
          expect(res.status).to.equal(204)
          done()
        })
    })
  })
}
/* eslint-enable no-undef */
