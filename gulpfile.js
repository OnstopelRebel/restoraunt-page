import gulp from "gulp";
import plumber from "gulp-plumber";
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
import postcss from "gulp-postcss";
import autoprefixer from "autoprefixer";
import browser from "browser-sync";
import csso from "postcss-csso";
import rename from "gulp-rename";
import htmlmin from "gulp-htmlmin";
import terser from "gulp-terser";
import squoosh from "gulp-libsquoosh";
import svgo from "gulp-svgmin";
import del from "del";
import svgstore from "gulp-svgstore";

const sass = gulpSass(dartSass);

// Styles

export const styles = () => {
  return gulp
    .src("source/sass/style.sass", { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer(), csso()]))
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css", { sourcemaps: "." }))
    .pipe(browser.stream());
};

// HTML

const html = () => {
  return gulp
    .src("source/*.html")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("build"));
};

// Scripts

const scripts = () => {
  return gulp.src("source/js/*.js").pipe(terser()).pipe(gulp.dest("build/js"));
};

// Images

const optimizeImages = () => {
  return gulp
    .src("source/img/**/*.{jpg,png}")
    .pipe(squoosh())
    .pipe(gulp.dest("build/img"));
};

const copyImages = () => {
  return gulp.src("source/img/**/*.{jpg,png}").pipe(gulp.dest("build/img"));
};

// WebP

const createWebp = () => {
  return gulp
    .src("source/img/**/*.{jpg,png}")
    .pipe(
      squoosh({
        webp: {},
      })
    )
    .pipe(gulp.dest("build/img"));
};

// SVG

const svg = (done) => {
  gulp
    .src(
      [
        "source/img/svg/*.svg",
        "source/img/favicons/*.svg",
        "!source/img/svg/icons/*.svg",
      ],
      {
        base: "source",
      }
    )
    .pipe(svgo())
    .pipe(gulp.dest("build"));
  done();
};

const sprite = () => {
  return gulp
    .src("source/img/svg/icons/*.svg")
    .pipe(svgo())
    .pipe(
      svgstore({
        inlineSvg: true,
      })
    )
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img/svg"));
};

// Copy

const copy = (done) => {
  gulp
    .src(
      ["source/fonts/*.{woff2,woff}", "source/*.ico", "source/*.webmanifest"],
      {
        base: "source",
      }
    )
    .pipe(gulp.dest("build"));
  done();
};

// Clean

const clean = () => {
  return del("build");
};

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: "build",
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
};

// Watcher

const watcher = () => {
  gulp
    .watch("source/sass/**/*.sass", gulp.series(styles)).on("save", browser.reload);
  gulp.watch("source/*.html", gulp.series(html)).on("change", browser.reload);
};

// Build

export const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(styles, html, scripts, svg, sprite, createWebp)
);

export default gulp.series(
  clean,
  copy,
  copyImages,
  styles,
  gulp.parallel(html, scripts, svg, sprite, createWebp),
  gulp.series(server, watcher)
);
