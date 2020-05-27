$('#progress-bar').hide();
// enable the selection and sorting of the elements
$(function() {
    $("#sortable").sortable();
    $("#sortable").disableSelection();



});

var totalImages = 0;
// ----------------
// call back function for selecting the images
function handleFileSelect3(evt) {
    $("#progress-bar").show();
    var files = evt.target.files; // FileList object
    totalImages = files.length;
    var imageData = [];
    var promises = [];

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        var thisPromise = new Promise(function(resolve, reject) {

            var imageInfo = {
                _id: "imageInfo",
                index: i,
                fileObject: f,
                resolveFn: resolve,
                rejectFn: reject
            };
            imageData.push(imageInfo);

            console.log(["Loading file>", f.name].join(''));
            loadImage.parseMetaData(f, function(data) {

                console.log(["parseMetaData callback>", this.fileObject.name].join(''));

                var options = {
                    maxWidth: 1000,
                    noRevoke: 'true',
                    canvas: 'true',
                    orientation: 'true'
                }

                if (data.exif) {
                    var tags = data.exif.getAll()
                    this.exposureValue = tags['ExposureValue'];
                    this.FNumber = tags['FNumber'];
                    console.log(tags['Orientation']);
                    options.orientation = tags['Orientation'];
                }


                // need to load the imageInfo
                if (!loadImage(
                        this.fileObject,
                        replaceResults.bind(this),
                        options
                    )) {
                    result.children().replaceWith(
                        $('<span>Your browser does not support the URL or FileReader API.</span>')
                    )
                }

            }.bind(imageInfo))

        }); // end of promise
        promises.push(thisPromise);
    }

    // wait for all
    console.log("Waiting for all promises");
    Promise.all(promises).then(function(results) {
            console.log('// Both promises resolved');
            $("#progress-bar").hide();

            $('.editable').editable({
                action: "click"
            }, function(e) {

            });

            // enable the icon buttons
            $('.btn_rotateRight').on('click', function(e1) {
                var imgElem = $(this).parents(".well").find('canvas');
                rotate(imgElem, "cw");
                $(this).parents(".well").find('a').attr('href', imgElem[0].toDataURL("image/png"));
            })
            $('.btn_rotateLeft').on('click', function(e1) {
                var imgElem = $(this).parents(".well").find('canvas');
                rotate(imgElem, "ccw");
                $(this).parents(".well").find('a').attr('href', imgElem[0].toDataURL("image/png"));
            })
            $('.btn_delete').on('click', function(e1) {
                $(this).parents("li").remove();
            })

        })
        .catch(function(error) {
            console.log('// One or more promises was rejected');
        });

}

// /.handleFileSelect

function replaceResults(img) {
    // Render thumbnail.
    console.log('replaceResults>' + this.fileObject.name + img);

    var cf = this.fileObject.name;
    var index = cf.toLowerCase().lastIndexOf(".jpg");

    cf = cf.substr(0, index);
    //  var span = document.createElement('li');
    var imgElem = img.toDataURL("image/png");

    var listElement = $('<li>');
    var wellElement = $('<div class="well">');
    var aLink = $('<a class="fancybox" data-fancybox-type="image" data-fancybox-group="gallery">').attr('caption', cf).attr('href', imgElem);


    var thumbCtrls = $('<div class="thumbCtrls">');
    var userIcon = $('<i class="fa fa-user-o">');
    var editableCaption = $('<p class="editable">').text(cf);
    thumbCtrls.append(userIcon);
    thumbCtrls.append(editableCaption).append($('<i class="fa fa-repeat btn_rotateRight btn btn-default" aria-hidden="true"></i>')).append($('<i class="fa fa-undo btn_rotateLeft btn btn-default" aria-hidden="true"></i>')).append($(
        '<i class="fa fa-trash-o btn_delete btn btn-default" aria-hidden="true"></i>'));

    aLink.append($(img).attr('class', 'thumb'));
    wellElement.append(aLink);
    wellElement.append(thumbCtrls)
    listElement.append(wellElement);

    $('#sortable').append(listElement);

    // resolve the promise
    this.resolveFn('Success!');
}

// bind the 'files' button to the event handler
document.getElementById('files_exif').addEventListener('change', handleFileSelect3, false);

// ----------------
// Start the slide show running
$('#id_fancybox').on('click', function(e) {
    $('.fancybox').fancybox({
        closeBtn: false,
        arrows: false,
        nextClick: true,
        padding: 0,
        loop: false,
        scrolling: 'no',
        type: 'image',
        helpers: {
            overlay: {
                css: {
                    'overflow': 'hidden',
                    'background': 'rgba(56, 56, 56, 1.00)' /* Standard syntax 'rgba(56, 56, 56, 1.00)' 'url("monopattern.png")' linear-gradient(to bottom right, black, gray)*/
                }
            },
            title: {
                type: 'outside'
            }

        },
        afterLoad: function() {
            var $scale = 0.8;
            this.title = '<p class="sImageCount">[Image ' + (this.index + 1) + ' of ' + this.group.length + ']</p> <p class="sImageTitle">' + $(this.element).next().find('.editable').text() + '</p>';
            wh = $(window).height() / this.height * $scale;
            ww = $(window).width() / this.width * $scale;
            if (wh < ww) {
                this.height = this.height * wh;
                this.width = this.width * wh;
            } else {
                this.height = this.height * ww;
                this.width = this.width * ww;
            }

        }
    });

    // id=sortable
    var $firstImage = $('#sortable').find("a:first");
    $firstImage.trigger('click');

})

// pass jquery wrapper of canvas object
function rotate(jqCanvas, direction) {
    //    //----------------------------------------------------------
    var img = jqCanvas[0];
    console.log(img);
    console.log(jqCanvas);
    var h = img.height;
    var w = img.width;


    var ctx = img.getContext("2d");
    var cw = img.width;
    var ch = img.height;


    // Create an second in-memory canvas:
    var mCanvas = document.createElement('canvas');
    mCanvas.width = img.width;
    mCanvas.height = img.height;
    var mctx = mCanvas.getContext('2d');

    // Draw your canvas onto the second canvas
    mctx.drawImage(img, 0, 0);
    // Clear your main canvas
    ctx.clearRect(0, 0, img.width, img.height);
    img.width = h;
    img.height = w;
    // set the rotation point as center of the canvas
    // (but you can set any rotation point you desire)
    // 		  ctx.translate(cw/2,ch/2);
    ctx.translate(ch / 2, cw / 2);
    // rotate by 90 degrees (==PI/2)
    var radians = 90 / 180 * Math.PI;
    if (direction === "ccw") {
        radians = radians * -1;
    }
    ctx.rotate(radians);
    // Draw the second canvas back to the (now rotated) main canvas:
    // 		  ctx.drawImage(mCanvas,-img.width/2,-img.height/2);

    ctx.drawImage(mCanvas, -img.height / 2, -img.width / 2);
    // clean up -- unrotate and untranslate
    ctx.rotate(-radians);
    ctx.translate(-img.width / 2, -img.height / 2);

    // //---------------------------------------------
}

$("#btn_removeImages").click(function(e) {
    $('#sortable').empty();
});
