const Odoo = require('./odoo');

const odoo = new Odoo({
    host: 'economie.digital',
    port: 443,
    database: 'digital',
    username: 'ocr_bc',
    password: '',
    protocol: 'https'
});

/*
odoo.update('product.template', productId, {
                // 128x128
                image_medium: fs.readFileSync(path, 'base64')
            }, this.createDefaultResponseHandler(resolve, reject));


  this.odoo.update('res.company', 1, {
            name: name,
            city: false,
            country_id: false,
            street: false,
            zip: false,
            email: false,
            logo: fs.readFileSync('assets/scissors.png', 'base64'),
            rml_header1: false,
            website: false,
        }, ()=>{});

            */



// state === draft, cancel, open, done
async function main() {
    try {
        await odoo.connect();
        const res = await odoo.search_read('event.registration', {
            limit: 100,
            fields: ['attendee_partner_id', 'email', 'x_company', 'name', 'state', 'date_open'],
            domain: [['event_id', '=', 1]]
        });
        console.log(res);
        console.log(res.length);
        /*
        res2 = await odoo.get('res.partner', {
            ids: res.map(r => r.attendee_partner_id[0]),
            fields: []
        })
        console.log(res2);
        */

    } catch (e) {
        console.log(e);
    }
}

main();
