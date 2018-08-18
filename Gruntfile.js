/*
 After you have changed the settings under responsive_images
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

    grunt.initConfig({
      responsive_images: {
        dev: {
          options: {
            engine: 'im',
            concurrency: 3,
            sizes: [{
              /* Change these */
              width: 800,
              suffix: '_large',
              quality: 75,
              aspectRatio: true
            },
            {
              /* Change these */
              width: 300,
              suffix: '_small',
              quality: 100,
              aspectRatio: true
            }]
          },
  
          /*
          You don't need to change this part if you don't change
          the directory structure.
          */
          files: [{
            expand: true,
            src: ['*.webp'],
            cwd: 'raw_images/',
            dest: 'img/'
          }]
        }
      },
      clean : ['./img/'],
      copy: {
        images: {
          files: [
            { 
              expand: true,
              cwd: 'raw_images/', 
              src: ['*.webp'], 
              dest:'img/' 
            }
          ]
        }
      }
    });
  
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.registerTask('default', ['clean', 'responsive_images']);
  
  };
  