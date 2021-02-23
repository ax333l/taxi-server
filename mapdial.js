const axios = require('axios');

const KEY = process.env.API_KEY || 'R7MY2CJ-ENP48EA-GVH4TWM-WRRZB4F'
const URL = 'https://fasfsa-scriptjs.e4ff.pro-eu-west-1.openshiftapps.com/api/public/'
//const URL = 'http://localhost:2000/api/public/'

if(!KEY) throw new Error('No API_KEY provided in ENV')

let instance = axios.create({
    headers: {
        common: {   
            api_key: KEY, 
            'Accept': 'application/json', 
            'Content-Type': 'application/json'
        }
    }
})

function mapref(id, region){
    return new Promise(async (resolve, reject) => {
        instance.post(`${URL}apikey/mapref`, {
            id: id,
            region: region
        })
        .then(res => {
            resolve(res.data)
        })
    })
}


function getMap(){
    return new Promise((resolve, reject) => {
        instance.get(`${URL}apikey/map`)
        .then(res => {
            resolve(res.data)
        })
    })
}

function getLocation(name){
    return new Promise((resolve, reject) => {
        instance.post(`${URL}apikey/location`, {
            name: name
        })
        .then(res => {
            resolve(res.data)
        })
    })
}

function getUser(name){
    return new Promise((resolve, reject) => {
        instance.post(`${URL}apikey/user`, {
            name: name
        })
        .then(res => {
            resolve(res.data)
        })
    })
}

const routes = {
    'create': 'POST',
    'edit': 'PATCH',
    'remove': 'DELETE'
}

async function marker(data){
    return new Promise(async (resolve, reject) => {
        instance.post(`${URL}map`, {
            ...data
        })
        .then(res => {
            resolve(res.data)
        })
        .catch(e => {
            reject(e.response.data)
        })
    })
}

async function editmarker(data){
    return new Promise(async (resolve, reject) => {
        instance.patch(`${URL}map`, {
            ...data
        })
        .then(res => {
            resolve(res.data)
        })
        .catch(e => {
            reject(e.response.data)
        })
    })
}

async function deletemarker(id){
    console.log(id)
    return new Promise(async (resolve, reject) => {
        instance.post(`${URL}mapdelete`, {
            _id: id
        })
        .then(res => {
            resolve(res.data)
        })
        .catch(e => {
            reject(e.response.data)
        })
    })
}

async function createPointAtUser(data,name){
    return new Promise(async (resolve, reject) => {
        data.private = true;
        if(!data.for){
            data.for = [name]
        }
        else{
            data.for.push(name)
        }
        data.type = 'marker'
        const location = await getLocation(name) 
        if(!data.variables) data.variables = {}
        data.variables = Object.assign(data.variables, location)
        marker(data)
        .then(res => {
            resolve(res)
        })
    })
}


async function updatePointAtUser(data,name){
    return new Promise(async (resolve, reject) => {
        const location = await getLocation(name) 
        if(!data.variables) data.variables = {}
        data.variables = Object.assign(data.variables, location)
        editmarker(data)
        .then(res => {
            resolve(res)
        })
    })
}

async function permit(id, name){
    return new Promise(async (resolve, reject) => {
        if(!id) id = (await getUser(name))._id
        instance.post(`${URL}apikey/permission`, {
            user_id: id
        })
        .then(res => {
            resolve(res.data)
        })
    })
}

module.exports.createPointAtUser = createPointAtUser
module.exports.getLocation = getLocation
module.exports.getMap = getMap
module.exports.permit = permit
module.exports.mapref = mapref
module.exports.getUser = getUser
module.exports.updatePointAtUser = updatePointAtUser
module.exports.deletemarker = deletemarker

/*async function boot(){
    const p = await permit(undefined, 'ax333l')
    console.log(p)
}

boot()*/



