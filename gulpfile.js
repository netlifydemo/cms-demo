var gulp = require('gulp');
var gutil = require('gulp-util');
var url = require('url');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var exec = require('gulp-exec');
var gulpFilter = require('gulp-filter');
var childProcess = require('child_process');
var livereload = require('gulp-livereload');
var coffee = require('gulp-coffee');
var ngAnnotate = require('gulp-ng-annotate');


gulp.task('build:admin', function() {
  gulp.src("admin/**/*.coffee")
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(ngAnnotate())
    .pipe(gulp.dest("_site/admin"))
})

gulp.task('build:jekyll', function(cb){
  childProcess.exec('bundle exec jekyll build', function(err) {
    if (err) return cb(err); // return error
    cb(); // finished task
  });
})

gulp.task('build', ['build:jekyll', 'build:admin'])

gulp.task('dev', function(){
  // Start a server
  connect.server({
    host: '0.0.0.0',
    root: '_site',
    port: 3000,
    livereload: true,
    middleware: function(connect, opt) {
      return [function(req, response, next) {
        if (req.method !== 'GET') {
          return next();
        } 
        var parsedUrl = url.parse(req.url);
        if (parsedUrl.pathname.match(/^\/admin\/.+/) && parsedUrl.pathname.indexOf(".") === -1) {
          req.url = "/admin/";
        }

        next()
      }]
    }
  });

  console.log('Server running at http://localhost:3000/');

 var reportOptions = {
      err: true, // default = true, false means don't write err
      stderr: true, // default = true, false means don't write stderr
      stdout: true // default = true, false means don't write stdout
  }

  gulp.watch(['*.html', '_layouts/*.html','_includes/*.html', 'css/*.css', 'css/*.scss', 'js/*.js', 'pages/*.md', '_courses/*.md', '_articles/*.md', '_books/*.md', 'admin/**/*.html', 'admin/css/*.scss', 'admin/**/*.js', 'admin/config.yml'], function(e) {
    console.log("watch event: ", e)
    childProcess.exec('bin/jekyll build', function(err) {
      if (err) return gutil.log(err) // return error
    })  
  })
    
});