const gulp = require('gulp');
const rename = require('gulp-rename');
const rollup = require('gulp-rollup');

// Error handling
function handleError(err) {
  console.error(err.message);
  this.emit('end');
}

gulp.task('bundle', function() {
  gulp.src('./src/**/*.js')
    .pipe(rollup({
      entry: './src/chart.js',
      format: 'es'
    }).on('error', handleError))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch('./src/**/*.js', ['bundle']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'bundle']);
