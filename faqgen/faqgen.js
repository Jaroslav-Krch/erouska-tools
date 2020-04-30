'use strict'

function scanChildNodes(ids,codes,parts,parentNode,parentPath,friendlyPath) {
    var children = parentNode.childNodes;

    if(children == undefined || children == null) return;

    for(var i=0; i< children.length; i++)
    {
        var child = children[i];
        var path = parentPath + "." + i + '.' + child.nodeName;
        var friendly = friendlyPath;

        if (!(child.nodeName == undefined || child.nodeName == null )) {
            if(child.nodeName == "P") {
                var rec = createRecord(ids, codes, parts, friendly, path, child.innerHTML);
                continue;
            }
            var match = child.nodeName.match(/UL|A|STRONG|B|EM|SUP|INS|DEL|SUB/g);
            if (match) {
                var rec = createRecord(ids, codes, parts, friendly, path, child.outerHTML);
                continue;
            }
        } 

        if (child.childNodes.length==0) {
            //console.log(child); return;
            if (!(child.nodeValue == undefined || child.nodeValue == null || child.nodeValue.trim() == "")) {
                var rec = createRecord(ids, codes, parts, friendly, path, child.nodeValue);
                //child.nodeValue = rec;
            }
        }

        if (child.childNodes.length > 0) {
            var friend = filterClasses(child.className);
            if (friend!="") {
                friendly = friendlyPath + "." + friend + "_" + i;
            }
            scanChildNodes(ids,codes,parts,child,path,friendly);
        }
    };
}

function makeitnice(text) {
    return text.replace(/\n/g,'  ').replace(/\s+/g,' ').trim();
}

function createRecord(ids, codes, parts, friendly, path, text) {
    //copy data out
    ids.push([friendly,path,JSON.stringify(makeitnice(text))].join('\t'));
    parts.push(makeitnice(text));

    return;
}

function filterClasses(classes) {
    // no filter
    return classes;
}

// copies all children to new sub node 
function insertNode(node, nodeName) {
    var newNode = document.createElement(nodeName);
    var nodes = node.childNodes;
    for (var i = nodes.length-1 ; i>=0 ; i-- ) {
        var child = nodes[i];
        node.removeChild(child);
        if (newNode.childNodes.length==0) {
            newNode.appendChild(child);
        } else {
            newNode.insertBefore(child,newNode.childNodes[newNode.childNodes-1]);
        }
    }
    node.appendChild(newNode);
}

// remove extra attributes
function removeStyles(node, rootNode) {
    if (!(rootNode === node)) {
        // converts some styles to nodes
        if (node.nodeName == "SPAN") {
            // add bold, em, sup, sub, ins, del tags
            // add bold
            if (node.style.fontWeight == "700") insertNode(node, "b");
            // add em
            if (node.style.fontStyle == "italic") insertNode(node, "em");
            // add sup
            if (node.style.verticalAlign == "super") insertNode(node, "sup");
            // add sub
            if (node.style.verticalAlign == "sub") insertNode(node, "sub");
            // add ins
            if (node.style.textDecorationLine == "underline") insertNode(node, "ins");
            // add del
            if (node.style.textDecorationLine == "line-through") insertNode(node, "del");
        }

        // remove formats
        node.removeAttribute("style");
        node.removeAttribute("dir");
        node.removeAttribute("role");
        node.removeAttribute("id");
    }

    // childNodes
    var children = node.childNodes;

    for(var i=0; i< children.length; i++)
    {
        var child = children[i];

        if (child.childNodes.length > 0) {
            removeStyles(child,rootNode);
        }
    };    

}


function removeExtraElements(htmlIn) {
    // removes <span> and any <h1> till <h5> <br> <div>
    var html = htmlIn.replace(/[<][/]?[h][1-5][>]|[<][/]?span[>]|[<]br[>]|[<][/]?div[>]/g,"").replace(/&nbsp;/g," ").trim();

    //chcek if starting element is missing
    if (html.startsWith("<")==false) {
        var match = /<p>|<ul>/.exec(html);
        if (match) {
            html = "<p>" + html.substr(0,match.index) + "</p>" + html.substr(match.index);
        } else {
            html = "<p>" + html + "</p>";
        }
    }

    //chcek if ending element is missing
    if (html.endsWith(">")==false) {
        var lastIndexUl = html.lastIndexOf("</ul>");
        var lastIndexP = html.lastIndexOf("</p>");
        if (lastIndexP >= 0 || lastIndexUl >=0) {
            var lastIndex = Math.max( lastIndexUl+5, lastIndexP+4);
            html = html.substr(0,lastIndex) + "<p>" + html.substr(lastIndex) + "</p>";
        } else {
            html = "<p>" + html + "</p>";
        }
    }
    
    return html;
    
}

//fix A and UL nodes
function removeExtraElementsAUL(node) {
    // fix A
    var nodes = document.getElementsByTagName("A");
    for (var i = 0; i < nodes.length; i++) {
        nodes[i].text = nodes[i].text;
        nodes[i].target = "_blank";
    }    
    
    // fix UL
    var nodes = document.getElementsByTagName("UL");
    for (var i = 0; i < nodes.length; i++) {
        console.log(nodes[i].innerHTML);
        nodes[i].innerHTML = nodes[i].innerHTML.replace(/[<][/]?p[>]/g,"");
        console.log(nodes[i].innerHTML);
    }    
}

// currently not in use
function createCodesList(textCodes) {
    var codes = [];

    textCodes.split('\n').forEach(element => {
        var row = element.split('\t');
        codes[row[0]] = row;
    });
    
    return codes;
}

function findTexts(element, questionCode, questionAnchor) {
    var ids = [];
    var parts = [];
    var codes = null; // not in use reserved
    var parentPath="X";
    var friendlyPath="F";
    
    scanChildNodes(ids,codes,parts,element,parentPath, friendlyPath);
    // ids 
    console.log(ids);

    //convert texts to final format 
    var outHtml = [];
    var webJson = {};
    var faqJson = {};

    // json to web.json and html to preview
    for(var i = 0; i < parts.length; i++ ) {
        var text = parts[i]; 
        
        //TODO: hardcoded keys
        if (i==0) {
            //question
            webJson['web.faq.questions.' + questionCode + ".question"] = text;
            //first element
            outHtml.push("<h3>" + text + "</h3>");
        } else {
            //answers
            webJson['web.faq.questions.' + questionCode + ".answer." + (i-1)] = text;

            //second and the rest of elements
            if (text.startsWith("<")) {
                outHtml.push(text);
            } else {
                outHtml.push("<p>" + text + "</p>");
            }
            
        }
    }

    // json to faq.json
    faqJson.id = questionCode;
    faqJson.anchor = questionAnchor;

    return { 
        ids : ids,
        outHtml : outHtml.join("\n"),
        webJson : webJson,
        faqJson : faqJson
    };
}

function parseFAQ() {
    try {
        console.log("ids");
        var htmlIn = document.getElementById("htmlIn");
        var codeIn = document.getElementById("codeIn");
        var anchorIn = document.getElementById("anchorIn");
        var webJsonOut = document.getElementById("webJsonOut");
        var faqJsonOut = document.getElementById("faqJsonOut");

        //is it empty
        if(htmlIn.innerHTML.trim() == "") return;

        console.log(htmlIn.innerHTML);

        //hack for missing end line
        htmlIn.innerHTML += "<br>";

        console.log("scan");
        //remove styles
        removeStyles(htmlIn,htmlIn);

        //remove extra elements in html
        htmlIn.innerHTML = removeExtraElements(htmlIn.innerHTML);
        console.log(htmlIn.innerHTML);

        //remove extra elements in A and LU
        removeExtraElementsAUL(htmlIn);

        // scan html
        var result = findTexts(htmlIn, codeIn.value, anchorIn.value);
        console.log(result);

        // display results
        htmlIn.innerHTML = result.outHtml;
        webJsonOut.value = JSON.stringify(result.webJson,null,2) //webJson;
        faqJsonOut.value = JSON.stringify(result.faqJson);

    
    } catch (error) {
        console.log("error");
        console.log(error);
        //display error to the user
        htmlIn.innerHTML = "error:<br>"+error;
    }
}


// Assign handlers immediately after making the request
window.onload = function () {

    //attach generate button
    this.document.getElementById("parseHtml").onclick = (()=>{
        
        this.parseFAQ();
    });

}
