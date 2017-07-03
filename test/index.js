const expect = require('expect');
const {createRobot} = require('probot');
const plugin = require('..');
const succeedEvent = require('./events/succeedEvent');
const failEvent = require('./events/failEvent');
const succIssueRes = require('./events/succIssueRes');
const failIssueRes = require('./events/failIssueRes');
const checkCount = require('../lib/checkCount');

describe('new-pr-welcome succeed', () => {
    let robot;
    let github;

    beforeEach(() => {
        robot = createRobot();
        plugin(robot);

        github = {
            repos: {
                getContent: expect.createSpy().andReturn(Promise.resolve({
                    data: {
                        content: Buffer.from(`Hello World!`).toString('base64')
                    }
                }))
            },
            issues: {
                getForRepo: expect.createSpy().andReturn(Promise.resolve(
                    succIssueRes
                )),
                createComment: expect.createSpy()
            }
        };

        check = new checkCount(succIssueRes);

        robot.auth = () => Promise.resolve(github);
    });

    it('posts a comment because it is a user\'s first PR', async () => {
        await robot.receive(succeedEvent);

        expect(github.issues.getForRepo).toHaveBeenCalledWith({
            owner: 'hiimbex',
            repo: 'testing-things',
            state: 'all',
            creator: 'hiimbex-testing'
        });

        expect(check.PRCount).toBe(true);

        expect(github.repos.getContent).toHaveBeenCalledWith({
            owner: 'hiimbex',
            repo: 'testing-things',
            path: '.github/new-pr-welcome.md'
        });

        expect(github.issues.createComment).toHaveBeenCalledWith({
            owner: 'hiimbex',
            repo: 'testing-things',
            number: 5,
            body: 'Hello World!'
        });
    });
});

describe('new-pr-welcome fail', () => {
    let robot;
    let github;

    beforeEach(() => {
        robot = createRobot();
        plugin(robot);

        github = {
            repos: {
                getContent: expect.createSpy().andReturn(Promise.resolve({
                    data: {
                        content: Buffer.from(`Hello World!`).toString('base64')
                    }
                }))
            },
            issues: {
                getForRepo: expect.createSpy().andReturn(Promise.resolve(
                    failIssueRes
                )),
                createComment: expect.createSpy()
            }
        };

        check = new checkCount(failIssueRes);

        robot.auth = () => Promise.resolve(github);
    });

    it('does not post a comment because it is not the user\'s first PR', async () => {
        await robot.receive(failEvent);

        expect(github.issues.getForRepo).toHaveBeenCalledWith({
            owner: 'hiimbex',
            repo: 'testing-things',
            state: 'all',
            creator: 'hiimbex'
        });

        expect(check.PRCount).toBe(false);
        expect(github.repos.getContent).toNotHaveBeenCalled();
        expect(github.issues.createComment).toNotHaveBeenCalled();
    });
});