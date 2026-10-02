import WidgetKit
import SwiftUI

// MARK: - targets/ios/WidgeBuddyWidget.swift
// Apple WidgetKit + SwiftUI Implementation for WidgeBuddy Home Screen Widgets.
// Reads synchronized JSON payload from App Group UserDefaults.

private let appGroupId = "group.com.widgebuddy.app"

struct WidgetEntry: TimelineEntry {
    let date: Date
    let title: String
    let temperature: Int
    let condition: String
    let location: String
    let forecastDays: [(day: String, temp: Int, icon: String)]
}

struct WidgeBuddyTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> WidgetEntry {
        WidgetEntry(
            date: Date(),
            title: "Weather Forecast",
            temperature: 21,
            condition: "Mostly Sunny",
            location: "San Francisco",
            forecastDays: [("Today", 21, "sun.max.fill"), ("Sun", 22, "cloud.sun.fill"), ("Mon", 19, "cloud.fill")]
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        completion(readLatestEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        let entry = readLatestEntry()
        // Refresh timeline every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func readLatestEntry() -> WidgetEntry {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupId),
              let rawJson = sharedDefaults.string(forKey: "active_widget_payload"),
              let data = rawJson.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let glance = json["glanceSummary"] as? [String: Any] else {
            return placeholder(in: .init())
        }

        let title = glance["title"] as? String ?? "WidgeBuddy"
        let temp = glance["temperature"] as? Int ?? 21
        let condition = glance["condition"] as? String ?? "Clear sky"
        let location = glance["location"] as? String ?? "Local Weather"

        var days: [(day: String, temp: Int, icon: String)] = []
        if let forecastArray = glance["forecastDays"] as? [[String: Any]] {
            for f in forecastArray {
                let d = f["day"] as? String ?? "Day"
                let t = f["temp"] as? Int ?? 20
                let iconName = mapToSfSymbol(f["icon"] as? String ?? "sun")
                days.append((day: d, temp: t, icon: iconName))
            }
        }

        return WidgetEntry(
            date: Date(),
            title: title,
            temperature: temp,
            condition: condition,
            location: location,
            forecastDays: days.isEmpty ? [("Today", temp, "sun.max.fill")] : days
        )
    }

    private func mapToSfSymbol(_ name: String) -> String {
        switch name.lowercased() {
        case "sun", "clear": return "sun.max.fill"
        case "cloud-sun", "partly-cloudy": return "cloud.sun.fill"
        case "cloud", "overcast": return "cloud.fill"
        case "cloud-rain", "rain": return "cloud.rain.fill"
        case "snow": return "snowflake"
        case "wind": return "wind"
        default: return "sun.max.fill"
        }
    }
}

// MARK: - SwiftUI Views for Small, Medium & Large layouts

struct SmallWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(entry.location)
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundColor(Color(hex: "#bae6fd"))
                    .lineLimit(1)
                Spacer()
                Image(systemName: entry.forecastDays.first?.icon ?? "sun.max.fill")
                    .foregroundColor(.yellow)
            }
            Spacer()
            Text("\(entry.temperature)°")
                .font(.system(size: 34, weight: .bold))
                .foregroundColor(.white)
            Text(entry.condition)
                .font(.caption2)
                .foregroundColor(Color(hex: "#e0f2fe"))
                .lineLimit(1)
        }
        .padding(14)
        .background(LinearGradient(
            colors: [Color(hex: "#0369a1"), Color(hex: "#0284c7")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        ))
    }
}

struct MediumWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        HStack(spacing: 12) {
            // Left column: Current conditions
            VStack(alignment: .leading, spacing: 4) {
                Text(entry.title)
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(Color(hex: "#bae6fd"))
                HStack(spacing: 6) {
                    Image(systemName: entry.forecastDays.first?.icon ?? "sun.max.fill")
                        .font(.title2)
                        .foregroundColor(.yellow)
                    Text("\(entry.temperature)°C")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }
                Text(entry.condition)
                    .font(.caption2)
                    .foregroundColor(Color(hex: "#e0f2fe"))
                Text(entry.location)
                    .font(.system(size: 10))
                    .foregroundColor(Color(hex: "#bae6fd"))
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider().background(Color(hex: "#0284c7"))

            // Right column: Forecast days
            HStack(spacing: 8) {
                ForEach(entry.forecastDays.prefix(3), id: \.day) { f in
                    VStack(spacing: 4) {
                        Text(f.day)
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color(hex: "#bae6fd"))
                        Image(systemName: f.icon)
                            .font(.caption)
                            .foregroundColor(.yellow)
                        Text("\(f.temp)°")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.white)
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(14)
        .background(LinearGradient(
            colors: [Color(hex: "#075985"), Color(hex: "#0369a1")],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        ))
    }
}

struct WidgeBuddyWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: WidgetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        default:
            MediumWidgetView(entry: entry)
        }
    }
}

@main
struct WidgeBuddyWidgetBundle: WidgetBundle {
    var body: some Widget {
        WidgeBuddyWidget()
    }
}

struct WidgeBuddyWidget: Widget {
    let kind: String = "WidgeBuddyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WidgeBuddyTimelineProvider()) { entry in
            WidgeBuddyWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("WidgeBuddy Widget")
        .description("Display your custom glanceable widgets on your iPhone Home Screen.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// Color hex extension helper
extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted))
        var int: UInt64 = 0
        scanner.scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 7: (a, r, g, b) = (255, (int >> 16) & 0xff, (int >> 8) & 0xff, int & 0xff)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
