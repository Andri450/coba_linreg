const AppError = require("../utils/appError");
const fs = require("fs");
const { parse } = require("csv-parse");

exports.downloadFile = (req, res, next) => {
    if (!req.params.id) {
        return next(new AppError("No P3KE id found", 404));
    }

    const folderPath = __dirname+'/../file_permintaan_data/';

    const fileName = req.params.id == 'bast' ? 'bast.xlsx' : 'format.xlsx'; 

    res.download(folderPath + fileName, fileName, (err) => {
        if (err) {
            console.log(err)
            // res.status(500).send({
            //     message: "Could not download the file. " + err,
            // });
        }
    });
};

exports.getcsv = (req, res, next) => {

    const dat = []
    let i = 0

    fs.createReadStream("./data_training/dat.csv")
        .pipe(parse())
        .on("data", function (row) {
            
            dat.push(row[0].split(';'));
            dat[i][2] = (parseInt(new Date(dat[i][2]).getMonth().toString()) + 1).toString()

            i++
        })
        .on("end", () => {
            dat.shift();

            let dats = []

            dat.map((d) => {
                
                let data = {
                    bulan: d[2],
                    total: d[11]
                }

                dats.push(data)

            })

            const datsMerge = dats.reduce((a, c) => {
                const obj = a.find((obj) => obj.bulan === c.bulan);
                if(!obj){
                   a.push(c);
                }
                else{
                   obj.total = parseInt(obj.total) + parseInt(c.total);
                }
                return a;
            }, []);       
            
            datsMerge.sort((a, b) => a['bulan'] - b['bulan'])
            
            let data_asli = datsMerge

            let a = 0

            let Sig_y = 0
            let Sig_x_kuadrat = 0

            let Sig_x = 0
            let Sig_xy = 0

            let n = 0

            let Sig_x_all = 0

            data_asli.map((d, i) => {
                if(d.total != 0){

                    Sig_y += parseInt(d.total)
                    Sig_x_kuadrat += parseInt(Math.pow(parseInt(d.bulan), 2))
                    //console.log(Math.pow(8,2) + Math.pow(2,2) + Math.pow(6,2) + Math.pow(4,2) + Math.pow(7,2) + Math.pow(3,2))
                    
                    Sig_x += parseInt(d.bulan)
                    Sig_xy += (parseInt(d.total) * parseInt(d.bulan))

                    n += 1

                }
            })
            Sig_x_all = Math.pow(Sig_x, 2)

            a = ((Sig_y * Sig_x_kuadrat) - (Sig_x * Sig_xy)) / ((n * Sig_x_kuadrat) - Sig_x_all)

            //////////////////////////////////////////////////

            let b = 0
            b = ((n * Sig_xy) - (Sig_x * Sig_y)) / ((n * Sig_x_kuadrat) - Sig_x_all)

            ///////////////////////////////

            let data_prediksi = []

            datsMerge.map((d, i) => {

                let y = 0
                y = a + (b * i)

                let data = {
                    bulan: d.bulan,
                    total: y
                }

                data_prediksi.push(data)
            })

            /////////////////////////////////////////////////////////////////////////////////
            let akurasi = 0
            let sig_yi = 0
            let sig_yy = 0
            let rata_aktual = 0
            for (let i = 0; i < data_asli.length; i++) {
                rata_aktual += data_asli[0]['total']
            }
            rata_aktual = rata_aktual / data_asli.length
            
            for (let i = 0; i < data_asli.length; i++) {
                sig_yi += (data_asli[i]['total'] - data_prediksi[i]['total'])
                sig_yy += (data_asli[i]['total'] - rata_aktual)
            }
            // R-squared
            akurasi = (1 - ( Math.pow(sig_yi, 2) / Math.pow(sig_yy, 2) ))

            ////////////////////////////

            let data_prediksi_masa_depan = []

            datsMerge.map((d, i) => {
                let data = {
                    bulan: d.bulan,
                    total: d.total
                }

                data_prediksi_masa_depan.push(data)
            })

            for (let i = data_prediksi_masa_depan.length + 1; i <= 12; i++) {
                let yx = a + (b * i)

                let data = {
                    bulan: i.toString(),
                    total: yx
                }

                data_prediksi_masa_depan.push(data)
            }

            res.status(200).json({
                data_asli,
                data_prediksi,
                data_prediksi_masa_depan,
                akurasi
            });

        })

}
