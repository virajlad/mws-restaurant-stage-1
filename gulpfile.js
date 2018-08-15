var gulp = require('gulp');
var browserify = require('browserify');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var source  = require('vinyl-source-stream');

gulp.task('browserify-sw', function() {
    return browserify('./service-worker_raw.js')
        .bundle()
        .pipe(source('service-worker.js'))
        .pipe(gulp.dest('./'));
});

gulp.task('default', ['browserify-sw','styles']);

gulp.task('styles', function(){
   gulp.src('sass/**/*.scss')
    .pipe(sass()).on('error', sass.logError)
    .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
    .pipe(gulp.dest('./css/'))
});