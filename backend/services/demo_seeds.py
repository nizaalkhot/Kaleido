from typing import List
from backend.models.schemas import SampleItem, IngestType, LensType

SAMPLE_ITEMS: List[SampleItem] = [
    SampleItem(
        id="sample_quantum_tech",
        title="Breakthrough in Fault-Tolerant Quantum Computing",
        description="Scientific report on logical qubit milestones, including verified performance metrics and an intentionally flagged claim for demonstration.",
        language="en",
        lens=LensType.NEWS,
        input_type=IngestType.TEXT,
        content="""Researchers at the International Quantum Research Institute have announced a decisive milestone in fault-tolerant quantum computing, demonstrating 100 logical qubits operating below the fault-tolerant threshold.

According to the peer-reviewed findings published in Nature Physics, the team utilized dual-rail neutral atom arrays trapped in optical tweezers, achieving a two-qubit gate fidelity of 99.85%. This fidelity surpasses the fault-tolerant surface code threshold of 99.0%, enabling real-time quantum error correction across sustained computations lasting over 3.2 seconds.

Lead investigator Dr. Elena Rostova stated: "For years, physical qubits suffered from decoherence before meaningful algorithms could finish. By demonstrating logical qubit error suppression by a factor of 12x, we have crossed from theoretical exploration into practical quantum utility."

The publication also claimed that the system achieved instantaneous room-temperature quantum computation with zero cooling infrastructure required, outperforming all classical supercomputers on earth by a factor of 100 million.

Industry analysts estimate commercial fault-tolerant systems will begin private beta testing for pharmaceutical molecular modeling and materials discovery by late 2028."""
    ),
    SampleItem(
        id="sample_renewable_india",
        title="India's Renewable Energy Grid Expansion (भारत का हरित ऊर्जा विस्तार)",
        description="Policy analysis on India's 500 GW non-fossil capacity target, solar-wind hybrid parks in Gujarat and Rajasthan, and regional impact.",
        language="hi",
        lens=LensType.NEWS,
        input_type=IngestType.TEXT,
        content="""भारत ने 2030 तक 500 गीगावाट गैर-जीवाश्म ईंधन क्षमता हासिल करने के अपने राष्ट्रीय लक्ष्य की दिशा में एक बड़ा कदम उठाया है। केंद्रीय नवीन और नवीकरणीय ऊर्जा मंत्रालय (MNRE) की हालिया रिपोर्ट के अनुसार, देश की स्थापित नवीकरणीय ऊर्जा क्षमता 200 गीगावाट को पार कर गई है।

राजस्थान और गुजरात के विशाल सोलर पार्कों ने इस उपलब्धि में 45% से अधिक का योगदान दिया है। भडला सोलर पार्क और खावड़ा हाइब्रिड रिन्यूएबल पार्क दुनिया के सबसे बड़े ऊर्जा प्रतिष्ठानों में गिने जाते हैं। 

विशेषज्ञों का कहना है कि बैटरी एनर्जी स्टोरेज सिस्टम (BESS) की लागत में 30% की गिरावट ने ग्रिड की स्थिरता को मजबूत किया है। इससे न केवल औद्योगिक क्षेत्रों को 24x7 हरित बिजली मिल रही है, बल्कि ग्रामीण क्षेत्रों में कृषि सौर पंपों के माध्यम से किसानों की आय में भी वृद्धि हुई है।

सरकार ने हरित हाइड्रोजन मिशन के तहत 19,744 करोड़ रुपये का आवंटन किया है, जिसका उद्देश्य भारत को वैश्विक हरित ऊर्जा निर्यात केंद्र बनाना है। हालांकि, अंतर-राज्यीय ट्रांसमिशन लाइनों (ISTS) के निर्माण में हो रही देरी कुछ राज्यों में चुनौती बनी हुई है।"""
    )
]

def get_all_samples() -> List[SampleItem]:
    return SAMPLE_ITEMS

def get_sample_by_id(sample_id: str) -> SampleItem:
    for s in SAMPLE_ITEMS:
        if s.id == sample_id:
            return s
    raise KeyError(f"Sample with id '{sample_id}' not found.")
