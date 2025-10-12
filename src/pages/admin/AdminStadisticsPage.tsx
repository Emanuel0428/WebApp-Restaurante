import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AdminHeader from "./AdminHeader";
import { DatePicker } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import moment from "moment";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";

const { RangePicker } = DatePicker;

function AdminStatisticsPage() {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<
    [moment.Moment | null, moment.Moment | null] | null
  >(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);

        let baseQuery = supabase
          .from("orden")
          .select("id_order, total_precio, created_at");

        if (
          selectedRange &&
          selectedRange[0] &&
          selectedRange[1] &&
          moment.isMoment(selectedRange[0]) &&
          moment.isMoment(selectedRange[1])
        ) {
          const startDate = selectedRange[0].startOf("day").toISOString();
          const endDate = selectedRange[1].endOf("day").toISOString();
          baseQuery = baseQuery
            .gte("created_at", startDate)
            .lte("created_at", endDate);
        }

        const { data, error } = await baseQuery;

        if (error) throw error;

        const totalSales = data.reduce(
          (sum: number, order: any) => sum + order.total_precio,
          0
        );
        const totalOrders = data.length;

        const salesData = data.reduce((acc: any[], order: any) => {
          const day = moment(order.created_at).format("YYYY-MM-DD");
          const existing = acc.find((entry) => entry.day === day);
          if (existing) {
            existing.sales += order.total_precio;
          } else {
            acc.push({ day, sales: order.total_precio });
          }
          return acc;
        }, []);

        setStatistics({
          totalSales,
          totalOrders,
          salesData,
        });
        setLoading(false);
      } catch (error) {
        setError("Error cargando estadísticas");
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [selectedRange]);

  const handleRangeChange = (
    dates: [moment.Moment | null, moment.Moment | null] | null
  ) => {
    if (dates && dates[0] && dates[1]) {
      setSelectedRange([dates[0], dates[1]]);
    } else {
      setSelectedRange(null);
    }
  };

  const exportToCSV = () => {
    if (statistics) {
      const csvContent = [
        ["Fecha", "Ventas Totales"],
        ...statistics.salesData.map((entry: { day: string; sales: number }) => [
          entry.day,
          entry.sales,
        ]),
      ]
        .map((e) => e.join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "estadísticas_ventas.csv");
    }
  };

  const exportToPDF = () => {
    if (statistics) {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Estadísticas de Ventas", 20, 20);
      doc.setFontSize(12);
      doc.text(`Total Ventas: $${statistics.totalSales}`, 20, 30);
      doc.text(`Total Pedidos: ${statistics.totalOrders}`, 20, 40);
      doc.text("Ventas por Día:", 20, 50);

      statistics.salesData.forEach(
        (entry: { day: string; sales: number }, index: number) => {
          doc.text(`${entry.day}: $${entry.sales}`, 20, 60 + index * 10);
        }
      );

      doc.save("estadísticas_ventas.pdf");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="p-4">
      <AdminHeader />
      <h1 className="text-xl font-bold mb-4">Estadísticas</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold">Seleccionar rango de fechas</h2>
        <RangePicker
          format="YYYY-MM-DD"
          onChange={handleRangeChange}
          className="mb-4"
          value={
            selectedRange && selectedRange[0] && selectedRange[1]
              ? [moment(selectedRange[0]), moment(selectedRange[1])]
              : null
          }
        />
      </div>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total de Ventas</h2>
          <p>${statistics.totalSales}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Total de Pedidos</h2>
          <p>{statistics.totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Ventas por Día</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={statistics.salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={exportToCSV}
            className="bg-blue-500 text-white py-2 px-4 rounded shadow"
          >
            Exportar a CSV
          </button>
          <button
            onClick={exportToPDF}
            className="bg-green-500 text-white py-2 px-4 rounded shadow"
          >
            Exportar a PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminStatisticsPage;
