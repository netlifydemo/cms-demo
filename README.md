# CMS Demo Site

This is a copy of [timespace.dk](http://www.timespace.dk) set up as a demo for
Netlify CMS.

## Getting the site running with the CMS

Fork the repository to your own account, then clone the fork and run:

```bash
bundle install
npm install
gulp dev
```

This will start a gulp server on [localhost:3000](http://localhost:3000/) with
live reload running.

Make sure to edit `admin/config.yml` to change the repo to your new fork.

Login to [netlify](https://app.netlify.com) and setup continuous deployment for
the repo. Netlify will guess `jekyll build` as a build command, but make sure to
change that to `gulp build`.

Once the site is deployed, go to the `access` tab for the site and follow the
[docs on Authentication Providers](https://www.netlify.com/docs/authentication-providers#using-an-authentication-provider)
to setup a Github authentication provider.

## Using the CMS

Now you can go to [localhost:3000/admin](http://localhost:3000/admin) and login
with GitHub.

When you save a piece of content, the CMS will create a new commit in GitHub and
that will trigger a new build and deploy.
