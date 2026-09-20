/**
 * js/crafting-tree.js
 * Sơ Đồ Cây Lộ Trình Chế Tạo Khoa Học Của Senku (Interactive Science Crafting Tree)
 * Hỗ trợ 4 Đại Dự Án Kinh Điển: Thuốc Sulfa 25 bước, Điện thoại vô tuyến, Nước hồi sinh, Tàu Perseus
 * Kết nối 2 chiều với Bảng Tuần Hoàn 118 Nguyên Tố 3D & Thẻ Căn Cước Khoa Học
 */

'use strict';

// DỮ LIỆU CÂY CHẾ TẠO 4 ĐẠI DỰ ÁN KHOA HỌC
const CRAFTING_ROADMAPS = {
  sulfa: {
    id: 'sulfa',
    title: 'Thuốc Kháng Sinh Sulfa',
    subtitle: 'Sulfanilamide 25 Bước Cứu Sống Vu Nữ Ruri',
    icon: '💊',
    color: '#39ff14',
    badge: 'Y HỌC 25 BƯỚC',
    era: 'Season 1 · Kỷ Nguyên Làng Ishigami',
    desc: 'Tuyệt phẩm hóa học vĩ đại nhất mùa 1 của Senku. Bằng việc kết hợp khoáng sản tự nhiên và 25 bước phản ứng tổng hợp hữu cơ, Senku đã điều chế thành công Sulfanilamide - loại kháng sinh đầu tiên của nhân loại ở thế giới đá.',
    stages: ['Nguyên Liệu Tự Nhiên', 'Xử Lý Hóa Chất', 'Phản Ứng Phức Hợp', 'Kiệt Tác Hoàn Thành'],
    nodes: [
      // Tầng 0: Nguyên liệu tự nhiên
      {
        id: 's_acid', stage: 0, x: 50, y: 80,
        name: 'Suối Độc Axit Sunfuric', en: 'Sulfuric Acid Source',
        icon: '☠️', formula: 'H₂SO₄', elements: ['S', 'H', 'O'],
        desc: 'Thu hoạch từ hồ nước độc chết người, đòi hỏi mặt nạ phòng độc và lòng dũng cảm của Senku, Chrome và Ginro.'
      },
      {
        id: 's_salt', stage: 0, x: 50, y: 220,
        name: 'Muối Ăn Biển', en: 'Sea Salt',
        icon: '🧂', formula: 'NaCl', elements: ['Na', 'Cl'],
        desc: 'Thu được bằng cách làm bay hơi nước biển ven bờ dưới ánh nắng mặt trời.'
      },
      {
        id: 's_shell', stage: 0, x: 50, y: 360,
        name: 'Vỏ Sò Biển (Canxi)', en: 'Seashells',
        icon: '🐚', formula: 'CaCO₃', elements: ['Ca', 'C', 'O'],
        desc: 'Nghiền nát vỏ sò biển để thu hồi Canxi Cacbonat, dùng làm vôi nung và cân bằng độ pH.'
      },
      {
        id: 's_coal', stage: 0, x: 50, y: 500,
        name: 'Than Đá & Tro Bếp', en: 'Coal & Wood Ash',
        icon: '🪵', formula: 'C (Carbon)', elements: ['C'],
        desc: 'Được thu thập từ mỏ than cổ và tro gỗ để chiết xuất hydrocacbon thơm và kiềm.'
      },
      {
        id: 's_wine', stage: 0, x: 50, y: 640,
        name: 'Rượu Nho Lên Men', en: 'Fermented Wild Wine',
        icon: '🍇', formula: 'C₂H₅OH (Ethanol)', elements: ['C', 'H', 'O'],
        desc: 'Nho rừng nghiền nát lên men tự nhiên 3 tuần tạo thành nguồn cồn thô.'
      },
      {
        id: 's_urine', stage: 0, x: 50, y: 780,
        name: 'Amoniac Từ Nước Tiểu', en: 'Ammonia Extract',
        icon: '🧪', formula: 'NH₃', elements: ['N', 'H'],
        desc: 'Khí Amoniac hăng nồng thu hồi bằng phương pháp đun nóng và làm nguội nước tiểu ủ men.'
      },

      // Tầng 1: Xử lý hóa chất
      {
        id: 's_hcl', stage: 1, x: 340, y: 150,
        name: 'Axit Clohydric', en: 'Hydrochloric Acid',
        icon: '⚗️', formula: 'HCl', elements: ['H', 'Cl'],
        deps: ['s_acid', 's_salt'],
        desc: 'Cho muối ăn NaCl tác dụng với Axit Sunfuric đậm đặc giải phóng khí HCl rồi ngưng tụ thành axit.'
      },
      {
        id: 's_hso3cl', stage: 1, x: 340, y: 280,
        name: 'Axit Clorosunfuric', en: 'Chlorosulfuric Acid',
        icon: '⚠️', formula: 'HSO₃Cl', elements: ['H', 'S', 'O', 'Cl'],
        deps: ['s_hcl', 's_acid'],
        desc: 'Chất lỏng ăn mòn cực mạnh, khói bốc nghi ngút dùng để gắn nhóm sunfonyl vào vòng benzen.'
      },
      {
        id: 's_naoh', stage: 1, x: 340, y: 410,
        name: 'Xút Ăn Da NaOH', en: 'Sodium Hydroxide',
        icon: '🧼', formula: 'NaOH', elements: ['Na', 'O', 'H'],
        deps: ['s_salt', 's_shell'],
        desc: 'Chất kiềm cực mạnh thu được từ nước tro bếp hoặc điện phân dung dịch muối.'
      },
      {
        id: 's_acetic', stage: 1, x: 340, y: 560,
        name: 'Axit Axetic (Giấm Ăn)', en: 'Acetic Acid',
        icon: '🫙', formula: 'CH₃COOH', elements: ['C', 'H', 'O'],
        deps: ['s_wine'],
        desc: 'Rượu vang tiếp xúc với oxy không khí bị vi khuẩn lên men thành giấm ăn tinh khiết.'
      },
      {
        id: 's_anhydride', stage: 1, x: 340, y: 690,
        name: 'Anhydrit Axetic', en: 'Acetic Anhydride',
        icon: '🔥', formula: '(CH₃CO)₂O', elements: ['C', 'H', 'O'],
        deps: ['s_acetic'],
        desc: 'Được chế tạo bằng cách nung giấm qua ống sắt nóng đỏ tạo ketene rồi hòa tan vào giấm băng.'
      },
      {
        id: 's_aniline', stage: 1, x: 340, y: 820,
        name: 'Hợp Chất Aniline', en: 'Aniline',
        icon: '🧪', formula: 'C₆H₅NH₂', elements: ['C', 'H', 'N'],
        deps: ['s_coal'],
        desc: 'Hợp chất amin thơm chưng cất từ nhựa than đá, là mắt xích xương sống của phân tử thuốc.'
      },

      // Tầng 2: Phản ứng phức hợp
      {
        id: 's_acetanilide', stage: 2, x: 640, y: 350,
        name: 'Acetanilide', en: 'Acetanilide',
        icon: '💎', formula: 'C₈H₉NO', elements: ['C', 'H', 'N', 'O'],
        deps: ['s_aniline', 's_anhydride'],
        desc: 'Bảo vệ nhóm amin bằng phản ứng axetyl hóa để phân tử không bị axit Clorosunfuric phá hủy.'
      },
      {
        id: 's_chlorosulfonyl', stage: 2, x: 640, y: 550,
        name: 'p-Acetamidobenzenesulfonyl Chloride', en: 'Sulfochloride Intermediate',
        icon: '⚡', formula: 'C₈H₈ClNO₃S', elements: ['C', 'H', 'Cl', 'N', 'O', 'S'],
        deps: ['s_acetanilide', 's_hso3cl'],
        desc: 'Phản ứng gắn nhóm sunfonyl clorua trực tiếp vào nhân benzen trong điều kiện làm lạnh.'
      },
      {
        id: 's_intermediate', stage: 2, x: 640, y: 720,
        name: 'Hợp Chất Trung Gian Sulfa', en: 'Sulfonamide Intermediate',
        icon: '🧪', formula: 'C₈H₁₀N₂O₃S', elements: ['C', 'H', 'N', 'O', 'S'],
        deps: ['s_chlorosulfonyl', 's_urine'],
        desc: 'Cho sản phẩm tác dụng trực tiếp với Amoniac NH₃ tạo liên kết sunfonamit vững chắc.'
      },

      // Tầng 3: Kiệt tác hoàn thành
      {
        id: 's_final', stage: 3, x: 960, y: 480,
        name: 'Thuốc Kháng Sinh Sulfa', en: 'Sulfanilamide (C₆H₈N₂O₂S)',
        icon: '💊', formula: 'C₆H₈N₂O₂S', elements: ['C', 'H', 'N', 'O', 'S'],
        deps: ['s_intermediate', 's_naoh'], isFinal: true,
        desc: 'THÀNH PHẨM VĨ ĐẠI! Thủy phân loại bỏ nhóm bảo vệ axetyl để giải phóng phân tử Sulfanilamide tinh khiết, tiêu diệt vi khuẩn phế cầu khuẩn và cứu sống Ruri.'
      }
    ]
  },

  phone: {
    id: 'phone',
    title: 'Điện Thoại Vô Tuyến Senku',
    subtitle: 'Vũ Khí Thông Tin Đè Bẹp Đế Chế Tsukasa Không Đổ Máu',
    icon: '📱',
    color: '#00d4ff',
    badge: 'THÔNG TIN VÔ TUYẾN',
    era: 'Season 2 · Kỷ Nguyên Stone Wars',
    desc: 'Chiếc điện thoại vô tuyến cự ly xa được phát minh để thực hiện đòn tấn công thông tin và ngoại giao tâm lý. Đây là kỳ tích kỹ thuật điện tử gồm đèn chân không, pin hóa học và loa micro áp điện.',
    stages: ['Quặng & Khoáng Sản', 'Linh Kiện Chế Tác', 'Module Điện Tử', 'Điện Thoại Hoàn Thiện'],
    nodes: [
      {
        id: 'p_scheelite', stage: 0, x: 50, y: 90,
        name: 'Quặng Scheelite (Vonfram)', en: 'Scheelite Ore',
        icon: '💎', formula: 'CaWO₄', elements: ['W', 'Ca', 'O'],
        desc: 'Phát hiện trong hang động nhờ tia cực tím huỳnh quang xanh ngọc, là quặng chứa kim loại cứng nhất: Vonfram.'
      },
      {
        id: 'p_manganese', stage: 0, x: 50, y: 250,
        name: 'Quặng Mangan Pyrolusite', en: 'Manganese Dioxide',
        icon: '🪨', formula: 'MnO₂', elements: ['Mn', 'O'],
        desc: 'Bột mangan đen nhánh thu thập từ trầm tích skarn dùng làm chất cực dương cho pin khô.'
      },
      {
        id: 'p_copper', stage: 0, x: 50, y: 410,
        name: 'Dây Đồng Kéo Tay', en: 'Copper Wire',
        icon: '🧲', formula: 'Cu', elements: ['Cu'],
        desc: 'Nấu chảy đồng rót vào rãnh ván cầu làng Ishigami rồi kéo sợi làm cuộn dây cảm ứng.'
      },
      {
        id: 'p_quartz', stage: 0, x: 50, y: 570,
        name: 'Cát Thạch Anh Tinh Khiết', en: 'Silica Quartz Sand',
        icon: '🏖️', formula: 'SiO₂', elements: ['Si', 'O'],
        desc: 'Nguyên liệu để nghệ nhân Kaseki thổi thủy tinh bóng đèn chân không.'
      },
      {
        id: 'p_wine_crust', stage: 0, x: 50, y: 730,
        name: 'Cặn Rượu Vang & Rong Biển', en: 'Wine Crystals & Seaweed',
        icon: '🍇', formula: 'KNaC₄H₄O₆', elements: ['K', 'Na', 'C', 'H', 'O'],
        desc: 'Cặn tinh thể axit tactric ở đáy thùng rượu vang phản ứng với tro rong biển kiềm.'
      },

      // Tầng 1: Linh kiện
      {
        id: 'p_tungsten_wire', stage: 1, x: 340, y: 150,
        name: 'Sợi Tóc Vonfram Nung Kết', en: 'Sintered Tungsten Filament',
        icon: '💡', formula: 'W (Vonfram 74)', elements: ['W'],
        deps: ['p_scheelite'],
        desc: 'Nhiệt luyện bột vonfram ở nhiệt độ siêu cao bằng pin than Magma để kết tinh sợi tóc chịu 3.422°C.'
      },
      {
        id: 'p_battery', stage: 1, x: 340, y: 310,
        name: 'Pin Khô Mangan-Kẽm', en: 'Zinc-Manganese Battery',
        icon: '🔋', formula: 'Zn + MnO₂', elements: ['Zn', 'Mn', 'C'],
        deps: ['p_manganese'],
        desc: 'Những viên pin khô hình trụ đầu tiên ở kỷ nguyên đá cung cấp dòng điện 1.5V ổn định.'
      },
      {
        id: 'p_glass_bulb', stage: 1, x: 340, y: 470,
        name: 'Bóng Thủy Tinh Chân Không', en: 'Glass Vacuum Enclosure',
        icon: '🔮', formula: 'SiO₂ Glass', elements: ['Si', 'O'],
        deps: ['p_quartz'],
        desc: 'Vỏ thủy tinh kín không bọt khí thổi bằng tay kết hợp bơm hút thủy ngân Hickman đạt chân không cao.'
      },
      {
        id: 'p_rochelle', stage: 1, x: 340, y: 690,
        name: 'Muối Rochelle Áp Điện', en: 'Rochelle Salt Crystal',
        icon: '💠', formula: 'KNaC₄H₄O₆·4H₂O', elements: ['K', 'Na', 'C', 'H', 'O'],
        deps: ['p_wine_crust'],
        desc: 'Tinh thể áp điện (Piezoelectric) kỳ diệu có khả năng biến đổi rung động âm thanh thành dòng điện.'
      },

      // Tầng 2: Module
      {
        id: 'p_triode', stage: 2, x: 640, y: 250,
        name: 'Đèn Chân Không 3 Cực (Triode)', en: 'Triode Vacuum Tube',
        icon: '📻', formula: 'Cathode W + Anode Plate + Grid', elements: ['W', 'Cu', 'Fe', 'Si'],
        deps: ['p_tungsten_wire', 'p_glass_bulb', 'p_copper'],
        desc: 'Trái tim của ngành điện tử hiện đại: Đèn 3 cực có khả năng khuếch đại tín hiệu âm thanh và phát sóng vô tuyến.'
      },
      {
        id: 'p_transducer', stage: 2, x: 640, y: 550,
        name: 'Micro & Loa Bột Than Nén', en: 'Piezo Microphone & Speaker',
        icon: '🎙️', formula: 'Carbon + Rochelle Crystal', elements: ['C', 'K', 'Na'],
        deps: ['p_rochelle'],
        desc: 'Hệ thống thu và phát thanh hai chiều chuyển giọng nói thành tín hiệu điện tử.'
      },

      // Tầng 3: Final
      {
        id: 'p_final', stage: 3, x: 960, y: 400,
        name: 'Điện Thoại Vô Tuyến Senku', en: 'Senku Wireless Cell Phone',
        icon: '📱', formula: 'Communications System', elements: ['W', 'Cu', 'Mn', 'Zn', 'K', 'Na', 'Si'],
        deps: ['p_triode', 'p_transducer', 'p_battery'], isFinal: true,
        desc: 'KẾT NỐI TƯƠNG LAI! Chiếc điện thoại đầu tiên truyền tải giọng nói qua sóng radio xuyên rừng rậm, giúp Senku và Gen đánh lừa toàn bộ quân đội Tsukasa.'
      }
    ]
  },

  nital: {
    id: 'nital',
    title: 'Dung Dịch Hồi Sinh Nital',
    subtitle: 'Công Thức Khởi Đầu Cho Việc Hồi Sinh 7 Tỷ Người',
    icon: '🧪',
    color: '#ffd700',
    badge: 'KHỞI NGUYÊN NITAL',
    era: 'Season 1 · Hang Động Phép Màu',
    desc: 'Chìa khóa mở ra toàn bộ thế giới Dr. Stone: Dung dịch ăn mòn đá công nghiệp kết hợp giữa Axit Nitric tự nhiên và cồn 96%, phá vỡ lớp vỏ hóa thạch 3.700 năm.',
    stages: ['Thu Hoạch Tự Nhiên', 'Chưng Cất & Lên Men', 'Tinh Chế Nồng Độ', 'Dung Dịch Phép Màu'],
    nodes: [
      {
        id: 'n_bat', stage: 0, x: 60, y: 150,
        name: 'Phân Dơi Hang Động Phép Màu', en: 'Cave Bat Guano',
        icon: '🦇', formula: 'Guano Deposit', elements: ['N', 'H', 'O'],
        desc: 'Hàng ngàn năm phân dơi tích tụ trong hang động bị vi khuẩn kỵ khí phân hủy thành muối nitrat.'
      },
      {
        id: 'n_grape', stage: 0, x: 60, y: 450,
        name: 'Nho Rừng Tự Nhiên', en: 'Wild Grapes',
        icon: '🍇', formula: 'Glucose C₆H₁₂O₆', elements: ['C', 'H', 'O'],
        desc: 'Trái nho dại chứa hàm lượng đường tự nhiên phong phú và men vi sinh trên bề mặt vỏ.'
      },

      {
        id: 'n_nitric', stage: 1, x: 380, y: 150,
        name: 'Axit Nitric Tự Nhiên', en: 'Nitric Acid (HNO₃)',
        icon: '💧', formula: 'HNO₃', elements: ['N', 'H', 'O'],
        deps: ['n_bat'],
        desc: 'Nước nhỏ giọt qua lớp phân dơi giàu nitrat tích tụ thành những giọt Axit Nitric tinh khiết.'
      },
      {
        id: 'n_wine', stage: 1, x: 380, y: 450,
        name: 'Rượu Vang Lên Men 3 Tuần', en: 'Fermented Wine (12% Alcohol)',
        icon: '🍷', formula: 'C₂H₅OH Ethanol', elements: ['C', 'H', 'O'],
        deps: ['n_grape'],
        desc: 'Taiju dẫm nho và khuấy đảo hàng ngày suốt 3 tuần để nấm men chuyển đường thành cồn.'
      },

      {
        id: 'n_ethanol', stage: 2, x: 680, y: 450,
        name: 'Cồn Chưng Cất 96% (Ethanol)', en: 'Distilled Ethanol 96%',
        icon: '🔥', formula: 'C₂H₅OH Pure Alcohol', elements: ['C', 'H', 'O'],
        deps: ['n_wine'],
        desc: 'Dùng nồi đất nung Kaseki chưng cất phân đoạn nhiều lần để đạt nồng độ cồn 96% cực chuẩn.'
      },

      {
        id: 'n_final', stage: 3, x: 960, y: 300,
        name: 'Nước Hồi Sinh Nital Hoàn Hảo', en: 'Miracle Revival Fluid (Nital)',
        icon: '🧪', formula: 'HNO₃ + C₂H₅OH', elements: ['N', 'C', 'H', 'O'],
        deps: ['n_nitric', 'n_ethanol'], isFinal: true,
        desc: 'PHÉP MÀU KHOA HỌC! Tỷ lệ pha chế hoàn hảo giữa Axit Nitric và Cồn 96%, hòa tan liên kết silicat của đá và đánh thức ý thức con người sau 3.715 năm.'
      }
    ]
  },

  perseus: {
    id: 'perseus',
    title: 'Chiến Hạm Khoa Học Perseus',
    subtitle: 'Vươn Ra Thái Bình Dương Đi Tìm Nguồn Gốc Hóa Đá',
    icon: '🚢',
    color: '#a855f7',
    badge: 'ĐẠI HÀNG HẢI NEW WORLD',
    era: 'Season 3 · New World',
    desc: 'Kỳ quan cơ khí hàng hải lớn nhất kỷ nguyên đá: Thuyền Perseus trang bị động cơ hơi nước, máy diesel, radar sonar và cả một phòng thí nghiệm hóa học hoàn chỉnh trên boong.',
    stages: ['Khai Thác Mỏ & Rừng', 'Luyện Kim & Nhiên Liệu', 'Động Cơ & Cánh Buồm', 'Chiến Hạm Perseus'],
    nodes: [
      {
        id: 'sh_iron', stage: 0, x: 50, y: 120,
        name: 'Cát Sắt Dưới Đáy Sông', en: 'River Iron Sand',
        icon: '⛏️', formula: 'Fe₃O₄', elements: ['Fe'],
        desc: 'Dùng nam châm hút hàng tấn cát sắt từ lòng sông để chuẩn bị cho mẻ thép khổng lồ.'
      },
      {
        id: 'sh_oil', stage: 0, x: 50, y: 320,
        name: 'Mỏ Dầu Sagara', en: 'Sagara Crude Oil',
        icon: '🛢️', formula: 'Petroleum Hydrocarbons', elements: ['C', 'H'],
        desc: 'Heo rừng Sagara dẫn đường giúp Senku và Ryusui tìm ra túi dầu mỏ tự nhiên trên mặt đất.'
      },
      {
        id: 'sh_fabric', stage: 0, x: 50, y: 520,
        name: 'Vải Dệt Máy Khung Cửi', en: 'Machine-woven Canvas Cloth',
        icon: '🧵', formula: 'Plant Fibers', elements: ['C', 'H', 'O'],
        desc: 'Yuzuriha chế tạo khung dệt cơ học tự động để dệt hàng trăm mét vuông vải buồm chịu bão.'
      },
      {
        id: 'sh_crystal', stage: 0, x: 50, y: 720,
        name: 'Thạch Anh Dò Thủy Âm', en: 'Quartz Hydrophone Crystal',
        icon: '📡', formula: 'SiO₂', elements: ['Si', 'O'],
        desc: 'Tinh thể thạch anh dao động tần số cao dùng làm máy Sonar quan sát đáy đại dương.'
      },

      // Tầng 1
      {
        id: 'sh_steel', stage: 1, x: 340, y: 180,
        name: 'Thép Tôi Luyện Lò Quạt Nước', en: 'Tempered Steel Plates',
        icon: '🛡️', formula: 'Fe + C Alloy', elements: ['Fe', 'C'],
        deps: ['sh_iron'],
        desc: 'Lò cao cấp 3 chạy bằng guồng nước tạo ra những tấm thép dẻo dai làm khung và chân vịt tàu.'
      },
      {
        id: 'sh_diesel', stage: 1, x: 340, y: 380,
        name: 'Xăng & Dầu Diesel Tinh Luyện', en: 'Distilled Diesel Fuel',
        icon: '⛽', formula: 'Liquid Fuel (C₁₂H₂₆)', elements: ['C', 'H'],
        deps: ['sh_oil'],
        desc: 'Tháp chưng cất dầu mỏ phân tách xăng nhẹ và dầu diesel chạy động cơ tàu.'
      },
      {
        id: 'sh_sails', stage: 1, x: 340, y: 620,
        name: 'Cánh Buồm Khí Động Học', en: 'Aerodynamic Ship Sails',
        icon: '⛵', formula: 'Heavy Duty Sails', elements: ['C', 'H', 'O'],
        deps: ['sh_fabric'],
        desc: 'Dưới sự tính toán khí động học của Ryusui, cánh buồm giúp tàu lướt đi cả khi ngược chiều gió.'
      },

      // Tầng 2
      {
        id: 'sh_engine', stage: 2, x: 640, y: 280,
        name: 'Động Cơ Đốt Trong Diesel', en: 'Internal Combustion Engine',
        icon: '⚙️', formula: '4-Stroke Engine', elements: ['Fe', 'C', 'Al'],
        deps: ['sh_steel', 'sh_diesel'],
        desc: 'Trái tim cơ khí của Perseus: Động cơ đốt trong 4 kỳ cung cấp hàng trăm mã lực vượt sóng dữ.'
      },
      {
        id: 'sh_sonar', stage: 2, x: 640, y: 620,
        name: 'Sonar Phản Xạ Thủy Âm & Radar', en: 'Sonar & Marine Radar',
        icon: '🐬', formula: 'Acoustic Sounding', elements: ['Si', 'Cu', 'Ag'],
        deps: ['sh_crystal'],
        desc: 'Mắt thần của chiến hạm: Máy dò sóng âm phát hiện bãi đá ngầm và tàu ngầm địch.'
      },

      // Tầng 3
      {
        id: 'sh_final', stage: 3, x: 960, y: 450,
        name: 'Chiến Hạm Khoa Học Perseus', en: 'Science Ship Perseus',
        icon: '🚢', formula: 'The Flagship of Science', elements: ['Fe', 'C', 'Cu', 'Si', 'Al'],
        deps: ['sh_engine', 'sh_sails', 'sh_sonar'], isFinal: true,
        desc: 'CON TÀU HY VỌNG! Dưới quyền chỉ huy của Ryusui, Perseus vượt Thái Bình Dương đến Đảo Kho Báu, mở ra chương Đại Hàng Hải rực rỡ nhất.'
      }
    ]
  }
};

// TRẠNG THÁI HIỆN TẠI CỦA CÂY CHẾ TẠO
let currentRoadmapId = 'sulfa';
let selectedNode = null;
let zoomLevel = 1;
let panX = 40;
let panY = 40;
let isPanning = false;
let startPanX = 0;
let startPanY = 0;

// KHỞI TẠO CÂY CHẾ TẠO KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
  initCraftingTree();
});

function initCraftingTree() {
  const container = document.getElementById('crafting-tree-container');
  if (!container) return;

  setupRoadmapTabs();
  setupCanvasInteractions();
  renderCraftingTree(currentRoadmapId);
}

function setupRoadmapTabs() {
  const tabs = document.querySelectorAll('.roadmap-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const projId = btn.getAttribute('data-roadmap');
      if (!CRAFTING_ROADMAPS[projId]) return;

      tabs.forEach(b => {
        b.classList.remove('active', 'border-[#00d4ff]', 'bg-[#00d4ff]/20', 'text-[#00d4ff]', 'shadow-[0_0_20px_rgba(0,212,255,0.4)]');
        b.classList.add('border-white/10', 'bg-white/5', 'text-[#94a3b8]');
      });

      btn.classList.add('active', 'border-[#00d4ff]', 'bg-[#00d4ff]/20', 'text-[#00d4ff]', 'shadow-[0_0_20px_rgba(0,212,255,0.4)]');
      btn.classList.remove('border-white/10', 'bg-white/5', 'text-[#94a3b8]');

      currentRoadmapId = projId;
      resetViewport();
      renderCraftingTree(projId);
    });
  });
}

function resetViewport() {
  zoomLevel = 1;
  panX = 30;
  panY = 30;
  updateTransform();
}

function updateTransform() {
  const surface = document.getElementById('crafting-surface');
  if (surface) {
    surface.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
  }
  const zoomText = document.getElementById('tree-zoom-text');
  if (zoomText) {
    zoomText.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
}

function setupCanvasInteractions() {
  const viewport = document.getElementById('crafting-viewport');
  if (!viewport) return;

  // Zoom controls
  document.getElementById('btn-tree-zoom-in')?.addEventListener('click', () => {
    zoomLevel = Math.min(zoomLevel + 0.15, 1.8);
    updateTransform();
  });

  document.getElementById('btn-tree-zoom-out')?.addEventListener('click', () => {
    zoomLevel = Math.max(zoomLevel - 0.15, 0.45);
    updateTransform();
  });

  document.getElementById('btn-tree-reset')?.addEventListener('click', () => {
    resetViewport();
  });

  // Pan by drag
  viewport.addEventListener('mousedown', (e) => {
    if (e.target.closest('.crafting-node-card')) return;
    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
    updateTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) {
      isPanning = false;
      if (viewport) viewport.style.cursor = 'grab';
    }
  });

  // Wheel zoom
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    zoomLevel = Math.min(Math.max(zoomLevel + delta, 0.45), 1.8);
    updateTransform();
  }, { passive: false });
}

function renderCraftingTree(roadmapId) {
  const roadmap = CRAFTING_ROADMAPS[roadmapId];
  if (!roadmap) return;

  const headerTitle = document.getElementById('roadmap-project-title');
  const headerSubtitle = document.getElementById('roadmap-project-subtitle');
  const headerBadge = document.getElementById('roadmap-project-badge');

  if (headerTitle) headerTitle.textContent = `${roadmap.icon} ${roadmap.title}`;
  if (headerSubtitle) headerSubtitle.textContent = roadmap.subtitle;
  if (headerBadge) {
    headerBadge.textContent = roadmap.badge;
    headerBadge.style.color = roadmap.color;
    headerBadge.style.borderColor = `${roadmap.color}40`;
    headerBadge.style.backgroundColor = `${roadmap.color}15`;
  }

  // Render SVG connector paths & HTML nodes
  const svgContainer = document.getElementById('crafting-svg-lines');
  const nodesContainer = document.getElementById('crafting-nodes-layer');
  if (!svgContainer || !nodesContainer) return;

  svgContainer.innerHTML = '';
  nodesContainer.innerHTML = '';

  const nodeMap = {};
  roadmap.nodes.forEach(n => { nodeMap[n.id] = n; });

  // 1. Render curved SVG lines connecting nodes
  roadmap.nodes.forEach(targetNode => {
    if (!targetNode.deps) return;

    targetNode.deps.forEach(depId => {
      const sourceNode = nodeMap[depId];
      if (!sourceNode) return;

      const x1 = sourceNode.x + 220; // right edge of source card
      const y1 = sourceNode.y + 50;  // vertical center
      const x2 = targetNode.x;       // left edge of target card
      const y2 = targetNode.y + 50;  // vertical center

      const dx = Math.abs(x2 - x1) * 0.5;
      const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', targetNode.isFinal ? '#39ff14' : '#00d4ff');
      path.setAttribute('stroke-width', targetNode.isFinal ? '3' : '2');
      path.setAttribute('stroke-opacity', '0.6');
      path.setAttribute('stroke-dasharray', '8 4');
      path.classList.add('crafting-flow-line');
      path.dataset.source = sourceNode.id;
      path.dataset.target = targetNode.id;

      svgContainer.appendChild(path);
    });
  });

  // 2. Render HTML Node Cards
  roadmap.nodes.forEach(node => {
    const card = document.createElement('div');
    const isFinal = !!node.isFinal;
    const borderClass = isFinal
      ? 'border-[#39ff14] shadow-[0_0_35px_rgba(57,255,20,0.4)] bg-[#05140d]/90'
      : 'border-white/10 hover:border-[#00d4ff] hover:shadow-[0_0_25px_rgba(0,212,255,0.3)] bg-[#0a0f1e]/90';

    card.className = `crafting-node-card absolute w-[220px] p-3.5 rounded-2xl border ${borderClass} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none`;
    card.style.left = `${node.x}px`;
    card.style.top = `${node.y}px`;
    card.dataset.nodeId = node.id;

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
          ${node.icon}
        </span>
        <span class="text-[0.6rem] font-mono px-2 py-0.5 rounded-full ${isFinal ? 'bg-[#39ff14]/20 text-[#39ff14]' : 'bg-[#00d4ff]/10 text-[#00d4ff]'} font-bold">
          ${node.formula}
        </span>
      </div>
      <h4 class="font-['Rajdhani'] font-bold text-sm text-white leading-snug truncate mb-1">
        ${node.name}
      </h4>
      <div class="flex items-center justify-between text-[0.62rem] font-['Rajdhani'] text-[#94a3b8]">
        <span>[${node.elements.join(', ')}]</span>
        <span class="text-[#38bdf8] hover:underline">Chi tiết ➔</span>
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openNodeInspector(node);
    });

    nodesContainer.appendChild(card);
  });

  // Automatically inspect final node by default
  const finalNode = roadmap.nodes.find(n => n.isFinal) || roadmap.nodes[0];
  if (finalNode) {
    openNodeInspector(finalNode, false);
  }

  updateTransform();
}

// BẢNG THÔNG TIN MẮT XÍCH (NODE INSPECTOR PANEL)
function openNodeInspector(node, awardPoints = true) {
  selectedNode = node;

  const panel = document.getElementById('node-inspector-panel');
  if (!panel) return;

  const iconEl = document.getElementById('inspect-icon');
  const titleEl = document.getElementById('inspect-title');
  const enEl = document.getElementById('inspect-en');
  const formulaEl = document.getElementById('inspect-formula');
  const descEl = document.getElementById('inspect-desc');
  const elementsEl = document.getElementById('inspect-elements-container');
  const btn3D = document.getElementById('inspect-btn-3d-jump');

  if (iconEl) iconEl.textContent = node.icon;
  if (titleEl) titleEl.textContent = node.name;
  if (enEl) enEl.textContent = node.en;
  if (formulaEl) formulaEl.textContent = node.formula;
  if (descEl) descEl.textContent = node.desc;

  if (elementsEl) {
    elementsEl.innerHTML = node.elements.map(sym => `
      <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#00d4ff]/15 border border-[#00d4ff]/40 text-white font-['Orbitron'] font-bold text-xs shadow-sm hover:scale-110 transition-transform">
        ${sym}
      </span>
    `).join('');
  }

  // Action Button: Highlight trên Bảng Tuần Hoàn 3D
  if (btn3D) {
    btn3D.onclick = () => {
      if (window.highlightElementsIn3DTable) {
        window.highlightElementsIn3DTable(node.elements, node.name, node.formula);
      }
    };
  }

  // Highlight selected node card
  document.querySelectorAll('.crafting-node-card').forEach(c => {
    c.classList.remove('ring-2', 'ring-[#00e5ff]');
    if (c.dataset.nodeId === node.id) {
      c.classList.add('ring-2', 'ring-[#00e5ff]');
    }
  });

  // Thưởng SP nếu người dùng click chủ động
  if (awardPoints && window.CitizenPass) {
    window.CitizenPass.addSciencePoints(10, `Khám phá mắt xích: ${node.name}!`);
  }
}

// Export to window
window.CRAFTING_ROADMAPS = CRAFTING_ROADMAPS;
window.renderCraftingTree = renderCraftingTree;
window.openNodeInspector = openNodeInspector;
