var express = require('express')       //express框架

var iconv = require('iconv-lite')    //解码

var cheerio = require('cheerio')     //node端jquery

var http = require('http')

var mongo = require('mongodb')     //mongodb

var assert = require('assert')       //断言模块

var Mongoclient = mongo.MongoClient

var index = 1      //爬取当前的页数

var page = 1        //爬取当前种子

var URLS = 'mongodb://localhost:27017/demo'   //本机数据库地址

var url = 'http://www.ygdy8.net/html/gndy/dyzz/list_23_'  //页数

var titles = [];     //放置数据

var URL = 'http://www.ygdy8.net'    //详情页链接

var superagent = require('superagent')

function btLink (i,n){
    http.get(`${URL}${n[i-1].href}`,(sres)=>{
        sres.setEncoding('utf-8');
        var thunks = [];
        console.log('正在爬取第'+i+"个种子")
        sres.on('data',(thunk)=>{                 //同下边一样
            thunks.push(thunk)
        })
        sres.on('end',(res)=>{

            //var html = iconv.decode(Buffer.concat(thunks),'gb2312')
            var $ = cheerio.load(thunks,{decodeEntities:false});
            $("#Zoom td").children('a').each((index,item)=>{
                var $item = $(item)
                titles[i-1].bt = $item.attr('href')
            })
            if (i == n.length){
                console.log('爬取完毕')
                console.log(titles)
                save(titles)                 //爬取完毕   将数据保存到本地数据库
            }else{
                btLink(++page,titles)
            }
        })
    })

let save = (titles) => {
    titles.forEach((m,i)=>{      //遍历将每一条数据都保存到数据库
        Mongoclient.connect(URLS,(err,db)=>{
            assert.equal(null,err)
            db.collection('video2').insert({video_name:m.title,bt:m.bt,id:i+1},(err,result)=>{
                if (err) console.log(err)
                db.close()
            })
        })
    })
  }
}

let video = (i,url)=>{
    var u = `${url}${i}.html`    //爬取的url
    http.get(u,(sres)=>{        //先向页面发起第一次请求
        console.log("正在爬取第"+i+'页')
        var thunks = [];        //放置html代码
        sres.on('data',(thunk)=>{     //监听data并将html代码放在数组中
            thunks.push(thunk)
        })
        sres.on('end',()=>{      //监听结束
            var html = iconv.decode(Buffer.concat(thunks),'gb2312');    //将html代码进行转码，不然会乱码
            var $ = cheerio.load(html,{decodeEntities:false});
            $('.co_content8 .ulink').each((index,item)=>{    //获取数据  并遍历
                var $item = $(item)
                titles.push({
                    title:$item.text(),          //数据的title
                    href:$item.attr("href")      //详情页的地址
                });
            })
            if (i === 10){                        //想要爬取的页数
                console.log(titles)              //递归调用   判断如果没有爬取完毕  接着调用自身
                console.log("爬取完毕")             //如果爬取完毕   继续爬取种子
                console.log('开始爬取种子')
                btLink(page,titles)
            }else{
                video(++index,url)
            }
        })
    })
}

let music = (url)=>{
    var music = []
    superagent.get(url).end((err,res)=>{
        if (err) {
            return err
        }
        var $ = cheerio.load(res.text);
        $('.col5 .icon-play a').each((index,item)=>{
            var $item = $(item)
            music.push({name:$item.text()})
        })
        console.log(music)
    })
}


let main = (i,url)=>{
    console.log('开始爬取')
    //video(i,url)   //先爬取页数
    music('https://music.douban.com/chart')
}

main(index,url)