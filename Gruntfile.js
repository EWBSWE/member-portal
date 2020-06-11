// Generated on 2015-04-11 using generator-angular-fullstack 2.0.13
"use strict";

module.exports = function (grunt) {
  var sass = require("node-sass");
  grunt.loadNpmTasks("grunt-sass");

  //grunt.loadNpmTasks('grunt-contrib-sass');
  // grunt.loadNpmTasks('grunt-express-server');
  // grunt.loadNpmTasks('grunt-usemin');
  // grunt.loadNpmTasks('grunt-angular-templates');
  // grunt.loadNpmTasks('grunt-google-cdn');
  // grunt.loadNpmTasks('grunt-protractor-runner');
  // grunt.loadNpmTasks('grunt-asset-injector');

  // // Load grunt tasks automatically, when needed
  require("jit-grunt")(grunt, {
    express: "grunt-express-server",
    useminPrepare: "grunt-usemin",
    ngtemplates: "grunt-angular-templates",
    cdnify: "grunt-google-cdn2",
    protractor: "grunt-protractor-runner",
    injector: "grunt-asset-injector",
  });

  // Time how long tasks take. Can help when optimizing build times
  require("time-grunt")(grunt);

  // Define the configuration for all the tasks
  grunt.initConfig({
    // Project settings
    pkg: grunt.file.readJSON("package.json"),
    yeoman: {
      // configurable paths
      client: require("./bower.json").appPath || "client",
      dist: "dist",
    },
    express: {
      options: {
        port: process.env.PORT || 9000,
      },
      dev: {
        options: {
          script: "server-dist/src/App.js",
          debug: true,
        },
      },
      prod: {
        options: {
          script: "dist/server/src/App.js",
        },
      },
    },
    open: {
      server: {
        url: "http://localhost:<%= express.options.port %>",
      },
    },
    watch: {
      injectJS: {
        files: [
          "<%= yeoman.client %>/{app,components}/**/*.js",
          "!<%= yeoman.client %>/{app,components}/**/*.spec.js",
          "!<%= yeoman.client %>/{app,components}/**/*.mock.js",
          "!<%= yeoman.client %>/app/app.js",
        ],
        tasks: ["injector:scripts"],
      },
      injectCss: {
        files: ["<%= yeoman.client %>/{app,components}/**/*.css"],
        tasks: ["injector:css"],
      },
      jsTest: {
        files: [
          "<%= yeoman.client %>/{app,components}/**/*.spec.js",
          "<%= yeoman.client %>/{app,components}/**/*.mock.js",
        ],
        tasks: ["newer:jshint:all", "karma"],
      },
      injectSass: {
        files: ["<%= yeoman.client %>/{app,components}/**/*.{scss,sass}"],
        tasks: ["injector:sass"],
      },
      sass: {
        files: ["<%= yeoman.client %>/{app,components}/**/*.{scss,sass}"],
        tasks: ["sass", "autoprefixer"],
      },
      gruntfile: {
        files: ["Gruntfile.js"],
      },
      livereload: {
        files: [
          "{.tmp,<%= yeoman.client %>}/{app,components}/**/*.css",
          "{.tmp,<%= yeoman.client %>}/{app,components}/**/*.html",
          "{.tmp,<%= yeoman.client %>}/{app,components}/**/*.js",
          "!{.tmp,<%= yeoman.client %>}{app,components}/**/*.spec.js",
          "!{.tmp,<%= yeoman.client %>}/{app,components}/**/*.mock.js",
          "<%= yeoman.client %>/assets/images/{,*//*}*.{png,jpg,jpeg,gif,webp,svg}",
        ],
        options: {
          livereload: true,
        },
      },
      express: {
        files: ["server-dist/src/**/*.{js,json}"],
        tasks: ["express:dev", "wait"],
        options: {
          livereload: true,
          nospawn: true, //Without this option specified express won't be reloaded
        },
      },
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: [
              ".tmp",
              "<%= yeoman.dist %>/*",
              "!<%= yeoman.dist %>/.git*",
              "!<%= yeoman.dist %>/.openshift",
              "!<%= yeoman.dist %>/Procfile",
            ],
          },
        ],
      },
      server: ".tmp",
    },

    // Add vendor prefixed styles
    autoprefixer: {
      options: {
        browsers: ["last 1 version"],
      },
      dist: {
        files: [
          {
            expand: true,
            cwd: ".tmp/",
            src: "{,*/}*.css",
            dest: ".tmp/",
          },
        ],
      },
    },

    // Use nodemon to run server in debug mode with an initial breakpoint
    nodemon: {
      debug: {
        script: "server-dist/src/App.js",
        options: {
          nodeArgs: ["--debug-brk"],
          env: {
            PORT: process.env.PORT || 9000,
          },
          callback: function (nodemon) {
            nodemon.on("log", function (event) {
              console.log(event.colour);
            });

            // opens browser on initial server start
            nodemon.on("config:update", function () {
              setTimeout(function () {
                require("open")("http://localhost:8080/debug?port=5858");
              }, 500);
            });
          },
        },
      },
    },

    // Automatically inject Bower components into the app
    wiredep: {
      target: {
        src: "<%= yeoman.client %>/index.html",
        ignorePath: "<%= yeoman.client %>/",
        exclude: [
          /bootstrap-sass-official/,
          /bootstrap.js/,
          "/json3/",
          "/es5-shim/",
          /bootstrap.css/,
          /font-awesome.css/,
        ],
      },
    },

    // Renames files for browser caching purposes
    rev: {
      dist: {
        files: {
          src: [
            "<%= yeoman.dist %>/public/{,*/}*.js",
            "<%= yeoman.dist %>/public/{,*/}*.css",
            "<%= yeoman.dist %>/public/assets/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}",
            "<%= yeoman.dist %>/public/assets/fonts/*",
          ],
        },
      },
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: ["<%= yeoman.client %>/index.html"],
      options: {
        dest: "<%= yeoman.dist %>/public",
      },
    },

    // Performs rewrites based on rev and the useminPrepare configuration
    usemin: {
      html: ["<%= yeoman.dist %>/public/{,*/}*.html"],
      css: ["<%= yeoman.dist %>/public/{,*/}*.css"],
      js: ["<%= yeoman.dist %>/public/{,*/}*.js"],
      options: {
        assetsDirs: [
          "<%= yeoman.dist %>/public",
          "<%= yeoman.dist %>/public/assets/images",
        ],
        // This is so we update image references in our ng-templates
        patterns: {
          js: [
            [
              /(assets\/images\/.*?\.(?:gif|jpeg|jpg|png|webp|svg))/gm,
              "Update the JS to reference our revved images",
            ],
          ],
        },
      },
    },

    imagemin: {
      dist: {
        files: [
          {
            expand: true,
            cwd: "<%= yeoman.client %>/assets/images",
            src: "{,*/}*.{png,jpg,jpeg,gif}",
            dest: "<%= yeoman.dist %>/public/assets/images",
          },
        ],
      },
    },

    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngAnnotate: {
      dist: {
        files: [
          {
            expand: true,
            cwd: ".tmp/concat",
            src: "*/**.js",
            dest: ".tmp/concat",
          },
        ],
      },
    },

    // Package all the html partials into a single javascript payload
    ngtemplates: {
      options: {
        // This should be the name of your apps angular module
        module: "ewbMemberApp",
        htmlmin: {
          collapseBooleanAttributes: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeEmptyAttributes: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
        },
        usemin: "app/app.js",
      },
      main: {
        cwd: "<%= yeoman.client %>",
        src: ["{app,components}/**/*.html"],
        dest: ".tmp/templates.js",
      },
      tmp: {
        cwd: ".tmp",
        src: ["{app,components}/**/*.html"],
        dest: ".tmp/tmp-templates.js",
      },
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ["<%= yeoman.dist %>/public/*.html"],
      },
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: "<%= yeoman.client %>",
            dest: "<%= yeoman.dist %>/public",
            src: [
              "*.{ico,png,txt}",
              ".htaccess",
              "bower_components/**/*",
              "assets/images/{,*/}*.{webp}",
              "assets/fonts/**/*",
              "index.html",
            ],
          },
          {
            expand: true,
            cwd: ".tmp/images",
            dest: "<%= yeoman.dist %>/public/assets/images",
            src: ["generated/*"],
          },
          {
            expand: true,
            dest: "<%= yeoman.dist %>/server",
            nonull: true,
            cwd: "server-dist",
            src: "**",
          },
          {
            expand: true,
            dest: "<%= yeoman.dist %>",
            src: "package.json",
          },
          {
            expand: true,
            dest: "<%= yeoman.dist %>",
            src: ["sql/**"],
          },
        ],
      },
      styles: {
        expand: true,
        cwd: "<%= yeoman.client %>",
        dest: ".tmp/",
        src: ["{app,components}/**/*.css"],
      },
    },

    buildcontrol: {
      options: {
        dir: "dist",
        commit: true,
        push: true,
        connectCommits: false,
        message:
          "Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%",
      },
      openshift: {
        options: {
          remote: "openshift",
          branch: "master",
        },
      },
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: ["sass"],
      test: ["sass"],
      debug: {
        tasks: ["nodemon"],
        options: {
          logConcurrentOutput: true,
        },
      },
      dist: ["sass", "imagemin"],
    },

    // Test settings
    karma: {
      unit: {
        configFile: "karma.conf.js",
        singleRun: true,
      },
    },

    mochaTest: {
      options: {
        reporter: "spec",
      },
      src: ["server/**/*.spec.js"],
    },

    env: {
      test: {
        NODE_ENV: "test",
      },
      prod: {
        NODE_ENV: "production",
      },
    },

    // Compiles Sass to CSS
    sass: {
      server: {
        options: {
          implementation: sass,
          includePaths: [
            "<%= yeoman.client %>/bower_components",
            "<%= yeoman.client %>/app",
            "<%= yeoman.client %>/components",
          ],
          compass: false,
        },
        files: {
          ".tmp/app/app.css": "<%= yeoman.client %>/app/app.scss",
        },
      },
    },

    injector: {
      options: {},
      // Inject application script files into index.html (doesn't include bower)
      scripts: {
        options: {
          transform: function (filePath) {
            filePath = filePath.replace("/client/", "");
            filePath = filePath.replace("/.tmp/", "");
            return '<script src="' + filePath + '"></script>';
          },
          starttag: "<!-- injector:js -->",
          endtag: "<!-- endinjector -->",
        },
        files: {
          "<%= yeoman.client %>/index.html": [
            [
              "{.tmp,<%= yeoman.client %>}/{app,components}/**/*.js",
              "!{.tmp,<%= yeoman.client %>}/app/app.js",
              "!{.tmp,<%= yeoman.client %>}/{app,components}/**/*.spec.js",
              "!{.tmp,<%= yeoman.client %>}/{app,components}/**/*.mock.js",
            ],
          ],
        },
      },

      // Inject component scss into app.scss
      sass: {
        options: {
          transform: function (filePath) {
            filePath = filePath.replace("/client/app/", "");
            filePath = filePath.replace("/client/components/", "");
            return "@import '" + filePath + "';";
          },
          starttag: "// injector",
          endtag: "// endinjector",
        },
        files: {
          "<%= yeoman.client %>/app/app.scss": [
            "<%= yeoman.client %>/{app,components}/**/*.{scss,sass}",
            "!<%= yeoman.client %>/app/app.{scss,sass}",
          ],
        },
      },

      // Inject component css into index.html
      css: {
        options: {
          transform: function (filePath) {
            filePath = filePath.replace("/client/", "");
            filePath = filePath.replace("/.tmp/", "");
            return '<link rel="stylesheet" href="' + filePath + '">';
          },
          starttag: "<!-- injector:css -->",
          endtag: "<!-- endinjector -->",
        },
        files: {
          "<%= yeoman.client %>/index.html": [
            "<%= yeoman.client %>/{app,components}/**/*.css",
          ],
        },
      },
    },

    mocha_istanbul: {
      coverage: {
        src: ["server/models", "server/api/*", "server/test/*"],
        options: {
          mask: "*.spec.js",
        },
      },
    },
    jsdoc: {
      dist: {
        src: ["server/**/*.js"],
        options: {
          destination: "doc",
        },
      },
    },
  });

  grunt.loadNpmTasks("grunt-mocha-istanbul");
  grunt.loadNpmTasks("grunt-jsdoc");

  // Used for delaying livereload until after server has restarted
  grunt.registerTask("wait", function () {
    grunt.log.ok("Waiting for server reload...");

    var done = this.async();

    setTimeout(function () {
      grunt.log.writeln("Done waiting!");
      done();
    }, 1500);
  });

  grunt.registerTask("express-keepalive", "Keep grunt running", function () {
    this.async();
  });

  grunt.registerTask("serve", function (target) {
    if (target === "dist") {
      return grunt.task.run([
        "build",
        "env:prod",
        "express:prod",
        "wait",
        "open",
        "express-keepalive",
      ]);
    }

    if (target === "debug") {
      return grunt.task.run([
        "clean:server",
        "injector:sass",
        "concurrent:server",
        "injector",
        "wiredep",
        "autoprefixer",
        "concurrent:debug",
      ]);
    }

    grunt.task.run([
      "clean:server",
      "injector:sass",
      "concurrent:server",
      "injector",
      "wiredep",
      "autoprefixer",
      "express:dev",
      "wait",
      "open",
      "watch",
    ]);
  });

  grunt.registerTask("test", function (target) {
    if (target === "server") {
      return grunt.task.run(["env:test", "mocha_istanbul"]);
    } else if (target === "client") {
      return grunt.task.run([
        "clean:server",
        "env:test",
        "injector:sass",
        "concurrent:test",
        "injector",
        "autoprefixer",
        //'karma'
      ]);
    } else if (target === "e2e") {
      return grunt.task.run([
        "clean:server",
        "env:test",
        "injector:sass",
        "concurrent:test",
        "injector",
        "wiredep",
        "autoprefixer",
        "express:dev",
        "protractor",
      ]);
    } else grunt.task.run(["test:server", "test:client"]);
  });

  grunt.registerTask("build", [
    "clean:dist",
    "injector:sass",
    "concurrent:dist",
    "injector",
    "wiredep",
    "useminPrepare",
    "autoprefixer",
    "ngtemplates",
    "concat",
    "ngAnnotate",
    "copy:dist",
    "cdnify",
    "cssmin",
    "uglify",
    "rev",
    "usemin",
  ]);

  grunt.registerTask("default", ["newer:jshint", "test", "build"]);

  grunt.registerTask("coverage", ["env:test", "mocha_istanbul"]);
};
