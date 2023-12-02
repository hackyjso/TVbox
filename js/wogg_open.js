import {load, _, Uri} from './lib/cat.js';
import {log} from './lib/utils.js';
import {initAli, detailContent, playContent}  from './lib/ali.js';

let siteKey = 'wogg';
let siteType = 0;
let siteUrl = 'https://wogg.xyz';
let UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";
let patternAli = /(https:\/\/www\.aliyundrive\.com\/s\/[^"]+)/

async function init(cfg) {
    try {
        siteKey = _.isEmpty(cfg.skey) ? '' : cfg.skey;
        siteType = _.isEmpty(cfg.stype) ? '' : cfg.stype;
        await initAli(cfg);
    } catch (e) {
        await log('init:' + e.message + ' line:' + e.lineNumber);
    }
}

async function request(reqUrl, agentSp) {
    let header = {
        'user-agent': agentSp || 'okhttp/3.12.0',
    };
    let uri = new Uri(reqUrl);
    let res = await req(uri.toString(), {
        headers: header,
        timeout: 10000
    });
    let content = res.content;
    return content;
}

function getHeader() {
    let header = {};
    header['User-Agent'] = UA;
    return header;
}

async function getString(url) {
    let res = await req(url, {
        headers: getHeader()
    });
    return res.content;
}

let classes = [{'type_id': 1, 'type_name' : '电影'},{'type_id': 20, 'type_name' : '电视剧'},{'type_id': 28, 'type_name' : '综艺'},{'type_id': 24, 'type_name' : '动漫'},{'type_id': 32, 'type_name' : '音乐'},{'type_id': 40, 'type_name' : '短剧'}];
let filterObj = {};
async function home(filter) {
    return JSON.stringify({
        class: classes,
        filters: filterObj,
    });
}


async function homeVod() {
    return '{}';
}


async function category(tid, pg, filter, extend) {
    let reqUrl = siteUrl + '/index.php/vodshow/'+tid+'--------'+pg+'---.html';
    let con = await request(reqUrl, UA);
    const $ = load(con);
    let items = $('.module:eq(0) > .module-list > .module-items > .module-item');
    let videos = [];
    for(var item of items) {
        let oneA = $(item).find('.module-item-cover .module-item-pic a').first();
        let href = oneA.attr('href');
        let name = oneA.attr('title');
        let oneImg = $(item).find('.module-item-cover .module-item-pic img').first();
        let pic = oneImg.attr('data-src');
        let remark = $(item).find('.module-item-text').first().text();
        videos.push({
            vod_id: href,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: remark,
        });
    }

    const hasMore = $('#page > a:contains(下一页)').length > 0;
    const pgCount = hasMore ? parseInt(pg) + 1 : parseInt(pg);
    return JSON.stringify({
        page: parseInt(pg),
        pagecount: pgCount,
        limit: 72,
        total: 72 * pgCount,
        list: videos,
    });
}

async function detail(id) {
    try {
        await log('detail:id:---' + id);
        let preMatches = id.match(patternAli);
        if (!_.isEmpty(preMatches)) return await detailContent(preMatches[1]);
        let url = siteUrl + id;
        let aliUrl = await getString(url);
        let matches = aliUrl.match(patternAli);
        console.log('detailmatche---');
        console.log(matches[1]);
        if (!_.isEmpty(matches)) return await detailContent(matches[1]);
        return '';
    } catch (e) {
        await log( 'detail:' + e.message + ' line:' + e.lineNumber);
    }
}


async function play(flag, id, flags) {
    try {
        return await playContent(flag, id, flags);
    }  catch (e) {
        await log( 'play:' + e.message + ' line:' + e.lineNumber);
    }
}


async function search(wd, quick) {
    await log('search---' + wd);
    let searchUrl = siteUrl + '/index.php/vodsearch/-------------.html?wd=' + wd;
    let html = await getString(searchUrl);
    let $ = load(html);
    let items = $('.module-search-item');
    let videos = [];
    for(var item of items) {
        let vodId = $(item).find(".video-serial")[0].attribs.href;
        let name = $(item).find(".video-serial")[0].attribs.title;
        let pic = $(item).find(".module-item-pic > img")[0].attribs['data-src'];
        let remark = '';
        videos.push({
            vod_id: vodId,
            vod_name: name,
            vod_pic: pic,
            vod_remarks: remark,
        });
    }
    return JSON.stringify({
        list: videos,
    });
}

export function __jsEvalReturn() {
    return {
        init: init,
        home: home,
        homeVod: homeVod,
        category: category,
        detail: detail,
        play: play,
        search: search,
    };
}