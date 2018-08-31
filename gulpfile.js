var gulp = require('gulp');
var browserify = require('browserify');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var source  = require('vinyl-source-stream');
var webp = require('gulp-webp');
var $ = require('gulp-load-plugins')();
var csso = require('gulp-csso');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');

gulp.task('browserify-sw', function() {
    return browserify('./service-worker_raw.js')
        .bundle()
        .pipe(source('service-worker.js'))
        .pipe(gulp.dest('./'));
});

gulp.task('default', ['browserify-sw','styles', 'dev-scripts', 'copy_images', 'responsive_images']);
gulp.task('prod', ['browserify-sw','styles', 'prod-scripts','copy_images', 'responsive_images']);

gulp.task('styles', function(){
   gulp.src('sass/**/*.scss')
    .pipe(sass()).on('error', sass.logError)
    .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
    .pipe(csso())
    .pipe(gulp.dest('./css/'))
});

gulp.task('webp', () =>
    gulp.src('raw_images/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('raw_images'))
);

gulp.task('responsive_images', function () {
  return gulp.src('raw_images/*.webp')
    .pipe($.responsive({
      '*.webp': [{
        quality: 100,
        width: 300,
        rename: { suffix: '-300_small' },
      }, {
        quality: 80,
        width: 800,
        rename: { suffix: '-800_large' },
      }],
    }, {
      quality: 100,
      withMetadata: false,
    }))
    .pipe(gulp.dest('img'));
});

gulp.task('copy_images', function(){
    return gulp.src('raw_images/*.{webp,svg}')
    .pipe(gulp.dest('img'))
});

gulp.task('dev-scripts', function(){
    return gulp.src('raw_js/**/*.js')
      .pipe(babel({
           presets: ['es2015']
          }))
      .pipe(gulp.dest('./js'));
});

gulp.task('prod-scripts', function(){
    return gulp.src('raw_js/**/*.js')
      .pipe(babel({
           presets: ['es2015']
          }))
      .pipe(uglify())
      .pipe(gulp.dest('./js'));
});