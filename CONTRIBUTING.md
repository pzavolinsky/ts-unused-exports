# Contributing

`ts-unused-exports` is maintained by volunteers, working in their free time. If you'd like to help out, contributions to `ts-unused-exports` are always welcome.

For inspiration, see our [open issues](https://github.com/pzavolinsky/ts-unused-exports/issues) or our [roadmap](https://github.com/pzavolinsky/ts-unused-exports/wiki).

Required tools:

- node - version 10 or 12
- npm - (comes with node)
- git

Fork, then clone the repo:

    git clone git@github.com:your-username/ts-unused-exports.git

Install dependencies:

    npm ci

Make sure the tests pass:

    npm test

Make your change. Add tests for your change. Make the tests pass:

    npm test

Add a summary of your change to the CHANGELOG.md file.

Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/pzavolinsky/ts-unused-exports/compare/

At this point you're waiting on us. We like to at least comment on pull requests
within a reasonable time. We may suggest some changes or improvements or alternatives.

Some things that will increase the chance that your pull request is accepted:

- Write tests.
- Try not to introduce new dependencies
- Try to follow the style of the existing code
- Write a [good commit message][commit].
- Add a suitable entry to the CHANGELOG.md file.
- Try to squash the branch down to 1 commit (but this is not vital, since `github` provides us with a nice *Squash* button on merge).

[commit]: http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html

# notes

## Debugging `ts-unused-exports` with Visual Code

To debug, in **Visual Code**, press `CTRL + SHIFT + B`.

Or make sure you run the following in a terminal:

    npm run watch

Back in **Visual Code**, open a file, add a breakpoint (`F9`).
Open a `.feature` file, put the cursor over a `Scenario:` line and press `F5`.

If you don't know where to put the breakpoint, you can always put it in the first line of the default export of `app.ts`.

Hint: to simplify debugging, you can comment out all the other tests in the file.
In **Visual Code**, a quick way to do this, is to select the tests you want to skip, and press `CTRL + /`.

Hint: to run only certain tests from the command line, place the `@only` decorator just before the test. Then execute them via `test:unit:only`.
