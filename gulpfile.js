var gulp = require('gulp');
var connect = require('gulp-connect');
var watch = require('gulp-watch');
var exec = require('gulp-exec');
var livereload = require('gulp-livereload');

gulp.task('dev', function(){
  // Start a server
  connect.server({
    host: '0.0.0.0',
    root: '_site',
    port: 3000,
    livereload: true
  });

  console.log('Server running at http://localhost:3000/');

  watch(['*.html', '_includes/*.html', 'css/*.css', 'css/*.scss', 'js/*.js'])
    .pipe(exec('jekyll build'))
    .pipe(connect.reload());
});