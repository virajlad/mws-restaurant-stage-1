var gulp = require('gulp');
var browserify = require('browserify');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var transform  = require('vinyl-transform');
var source  = require('vinyl-source-stream');

gulp.task('browserify', function () {
    
    var browserified = transform(
        function(filename) {
            return browserify(filename).bundle();
        });
   
   return gulp.src('./service-worker.js')
        .pipe(browserified)
        .pipe(source('service-worker.js'))
        .pipe(gulp.dest('./dist'));
});

// gulp.task('browserify-sw', function (cb) {
//   pump([
//       gulp.src('js/service-worker.js'),
//       browserify(),
//       gulp.dest('/')
//     ],
//     cb
//   );
// });

gulp.task('default', function(){
    console.log('Hello from Gulp');
});

gulp.task('styles', function(){
   gulp.src('sass/**/*.scss')
    .pipe(sass()).on('error', sass.logError)
    .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
    .pipe(gulp.dest('./css/'))
});